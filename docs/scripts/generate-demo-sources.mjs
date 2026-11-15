import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

function unwrap(expression) {
  while (
    ts.isSatisfiesExpression(expression) ||
    ts.isAsExpression(expression) ||
    ts.isParenthesizedExpression(expression)
  ) {
    expression = expression.expression;
  }
  return expression;
}

/** Read source only; never execute the React Native modules being documented. */
export function generateDemoSources({ recipesSource, playerSource, catalog }) {
  const fileName = '/docsDemoRecipes.ts';
  const options = { noLib: true, noResolve: true, target: ts.ScriptTarget.Latest };
  const source = ts.createSourceFile(fileName, recipesSource, options.target, true);
  if (source.parseDiagnostics.length > 0) {
    throw new Error(ts.flattenDiagnosticMessageText(source.parseDiagnostics[0].messageText, '\n'));
  }

  const host = ts.createCompilerHost(options);
  host.getSourceFile = (name) => (name === fileName ? source : undefined);
  host.fileExists = (name) => name === fileName;
  host.readFile = (name) => (name === fileName ? recipesSource : undefined);
  const checker = ts.createProgram([fileName], options, host).getTypeChecker();
  const declarations = new Map();
  const declarationSymbols = new Map();
  const variantDeclarations = [];
  const imports = [];
  const importSymbols = new Set();

  for (const statement of source.statements) {
    if (ts.isVariableStatement(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name)) continue;
        if (declaration.name.text === 'docsDemoVariants') {
          variantDeclarations.push(declaration);
        }
        declarations.set(declaration.name.text, declaration);
        declarationSymbols.set(checker.getSymbolAtLocation(declaration.name), declaration);
      }
    } else if (ts.isImportDeclaration(statement)) {
      imports.push(statement);
      const clause = statement.importClause;
      if (clause?.name) {
        importSymbols.add(checker.getSymbolAtLocation(clause.name));
      }
      if (clause?.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings)) {
          for (const element of clause.namedBindings.elements) {
            importSymbols.add(checker.getSymbolAtLocation(element.name));
          }
        } else {
          importSymbols.add(checker.getSymbolAtLocation(clause.namedBindings.name));
        }
      }
    }
  }

  function objectInitializer(expression, seen = new Set()) {
    if (!expression) throw new Error('Missing demo initializer.');
    expression = unwrap(expression);
    if (ts.isObjectLiteralExpression(expression)) return expression;
    if (ts.isIdentifier(expression) && !seen.has(expression.text)) {
      seen.add(expression.text);
      return objectInitializer(declarations.get(expression.text)?.initializer, seen);
    }
    throw new Error('Demo values must be object literals or top-level object aliases.');
  }

  function registryEntries(registry, label) {
    const entries = new Map();
    for (const property of registry.properties) {
      if (
        !ts.isPropertyAssignment(property) ||
        (!ts.isIdentifier(property.name) && !ts.isStringLiteral(property.name))
      ) {
        throw new Error(`The ${label} registry must use explicit named properties.`);
      }
      const name = property.name.text;
      if (entries.has(name)) throw new Error(`Duplicate ${label} ID: ${name}`);
      entries.set(name, objectInitializer(property.initializer));
    }
    return entries;
  }

  const entries = registryEntries(
    objectInitializer(declarations.get('docsDemoRecipes')?.initializer),
    'demo',
  );

  const catalogIds = Object.keys(catalog).toSorted();
  if (JSON.stringify([...entries.keys()].toSorted()) !== JSON.stringify(catalogIds)) {
    throw new Error('The demo registry and documentation catalog must have identical IDs.');
  }

  function extractSource(initializer) {
    const neededDeclarations = new Set();
    const neededImports = new Set();

    function visit(node) {
      if (ts.isIdentifier(node)) {
        const symbol = checker.getSymbolAtLocation(node);
        const declaration = declarationSymbols.get(symbol);
        if (declaration && !neededDeclarations.has(declaration)) {
          neededDeclarations.add(declaration);
          if (declaration.initializer) visit(declaration.initializer);
        } else if (importSymbols.has(symbol)) {
          neededImports.add(symbol);
        }
      }
      ts.forEachChild(node, visit);
    }
    visit(initializer);

    const chunks = [];
    for (const statement of imports) {
      const clause = statement.importClause;
      if (!clause) continue;
      const bindings = [];
      if (clause.name && neededImports.has(checker.getSymbolAtLocation(clause.name))) {
        bindings.push(clause.name.getText(source));
      }
      if (clause.namedBindings) {
        if (ts.isNamedImports(clause.namedBindings)) {
          const named = clause.namedBindings.elements.filter((element) =>
            neededImports.has(checker.getSymbolAtLocation(element.name)),
          );
          if (named.length > 0) {
            bindings.push(`{ ${named.map((element) => element.getText(source)).join(', ')} }`);
          }
        } else if (neededImports.has(checker.getSymbolAtLocation(clause.namedBindings.name))) {
          bindings.push(clause.namedBindings.getText(source));
        }
      }
      if (bindings.length > 0) {
        chunks.push(
          `import ${clause.isTypeOnly ? 'type ' : ''}${bindings.join(', ')} from ${statement.moduleSpecifier.getText(source)};`,
        );
      }
    }

    for (const declaration of declarations.values()) {
      if (!neededDeclarations.has(declaration)) continue;
      const list = declaration.parent;
      const kind =
        list.flags & ts.NodeFlags.Const ? 'const' : list.flags & ts.NodeFlags.Let ? 'let' : 'var';
      chunks.push(`${kind} ${declaration.getText(source)};`);
    }
    chunks.push(`const demo = ${initializer.getText(source)};`);
    return `${chunks.join('\n\n')}\n`;
  }

  const recipes = Object.fromEntries(
    Object.keys(catalog).map((id) => [id, extractSource(entries.get(id))]),
  );
  const variants = {};
  if (variantDeclarations.length > 0) {
    const declaration = variantDeclarations[0];
    const statement = declaration.parent.parent;
    if (
      variantDeclarations.length !== 1 ||
      !(declaration.parent.flags & ts.NodeFlags.Const) ||
      !statement.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword)
    ) {
      throw new Error(
        'The variant registry must be one top-level exported const docsDemoVariants.',
      );
    }
    const variantEntries = registryEntries(objectInitializer(declaration.initializer), 'variant');
    for (const [id, variantOptions] of variantEntries) {
      if (!Object.hasOwn(catalog, id)) throw new Error(`Unknown variant demo ID: ${id}`);
      variants[id] = Object.fromEntries(
        [...registryEntries(variantOptions, 'variant option')].map(([option, initializer]) => [
          option,
          extractSource(initializer),
        ]),
      );
    }
  }

  return { recipes, player: playerSource, variants };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = generateDemoSources({
    recipesSource: readFileSync(
      new URL('../../example/src/docsDemoRecipes.ts', import.meta.url),
      'utf8',
    ),
    playerSource: readFileSync(new URL('../../example/src/DocsDemo.tsx', import.meta.url), 'utf8'),
    catalog: JSON.parse(readFileSync(new URL('../demos.json', import.meta.url), 'utf8')),
  });
  mkdirSync(new URL('../.cache/', import.meta.url), { recursive: true });
  writeFileSync(
    new URL('../.cache/demo-sources.json', import.meta.url),
    `${JSON.stringify(result, null, 2)}\n`,
  );
  process.stdout.write(
    `Extracted current source for ${Object.keys(result.recipes).length} demos.\n`,
  );
}
