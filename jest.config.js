const config = require('@S_E_C_R_E_T/jest-config-node'); // eslint-disable-line @typescript-eslint/no-var-requires

module.exports = {
  ...config,
  coverageThreshold: {
    global: {
      statements: 78,
      branches: 54,
      functions: 78,
      lines: 78,
    },
  },
};
