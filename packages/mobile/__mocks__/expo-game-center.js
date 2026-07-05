// Manual Jest mock for `expo-game-center`.
//
// Community native module for iOS Game Center; unavailable under the jest-expo
// (Node) preset. The default export mirrors the native surface used by the
// Game Center provider. Defaults simulate an available, authenticated player;
// override per-test with jest.spyOn(ExpoGameCenter, "...").
/* global jest */
const ExpoGameCenter = {
  isGameCenterAvailable: jest.fn(async () => true),
  authenticateLocalPlayer: jest.fn(async () => true),
  getLocalPlayer: jest.fn(async () => ({
    playerID: "G:123456789",
    displayName: "Mock Player",
    alias: "mockplayer",
  })),
  getPlayerImage: jest.fn(async () => null),
  submitScore: jest.fn(async () => true),
  reportAchievement: jest.fn(async () => true),
  presentLeaderboard: jest.fn(async () => undefined),
  presentAchievements: jest.fn(async () => undefined),
  presentGameCenterViewController: jest.fn(async () => undefined),
};

module.exports = ExpoGameCenter;
module.exports.default = ExpoGameCenter;
