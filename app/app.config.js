module.exports = ({ config }) => {
  if (process.env.SCANSCIENCE_SIDELOAD !== '1') return config;
  // Bản thử cá nhân dùng backend cùng Wi-Fi; bản phát hành giữ cấu hình gốc.
  return {
    ...config,
    ios: {
      ...config.ios,
      infoPlist: {
        ...config.ios?.infoPlist,
        NSLocalNetworkUsageDescription: 'Kết nối máy tính của bạn để chạy AI trong bản thử cá nhân.',
        NSAppTransportSecurity: { NSAllowsLocalNetworking: true },
      },
    },
  };
};
