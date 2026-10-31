module.exports = ({ config }) => {
  if (process.env.TEXT_MOTION_DOCS_WEB_EXPORT !== '1') {
    return config;
  }

  return {
    ...config,
    experiments: {
      ...config.experiments,
      baseUrl: '/demos',
    },
  };
};
