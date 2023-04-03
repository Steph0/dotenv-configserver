const when = require('jest-when').when;
const verifyAllWhenMocksCalled = require('jest-when').verifyAllWhenMocksCalled;
const core = require('@actions/core');
const inputs = require('../src/inputs');
const configserver = require('../src/configserver');
const envFile = require('../src/environment-file');
const outputs = require('../src/outputs');
const cleanup = require('../src/cleanup');
const main = require('../src/main');

describe('Main', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should not clean anything if perform as been marked as 'false'", async () => {
    // Given
    const settings = {
      repository: 'Steph0/dotenv-configserver',
      owner: 'Steph0',
      repo: 'dotenv-configserver',
      token: 'xxxxxxxxxxxxxxxxxx',
      branch: 'main',
      destination: '.',
      directory: '.',
      filename: '.env',
      profile: '',
      cleanup: true,
    };


    when(jest.spyOn(inputs, 'load')).expectCalledWith().mockReturnValue(settings);

    const folder = './notafolder';
    when(jest.spyOn(configserver, 'fetch'))
      .expectCalledWith(settings.owner, settings.repo, settings.branch,
        settings.token, settings.destination)
      .mockResolvedValue(folder);

    const configurationFile = 'configurationFile';
    when(jest.spyOn(envFile, 'buildEnvFilename'))
      .expectCalledWith(folder, settings.directory,
        settings.filename, settings.profile)
      .mockReturnValue(configurationFile);

    const envData = {};
    when(jest.spyOn(envFile, 'loadDotenvFile'))
      .expectCalledWith(configurationFile)
      .mockReturnValue(envData);

    when(jest.spyOn(outputs, 'exportToGithubEnv'))
      .expectCalledWith(envData).mockReturnValue();

    when(jest.spyOn(outputs, 'exportToOutput'))
      .expectCalledWith(envData).mockReturnValue();

    when(jest.spyOn(cleanup, 'cleanup'))
      .expectCalledWith(folder, settings.cleanup).mockResolvedValueOnce();

    // When
    await main.run();

    // Then
    verifyAllWhenMocksCalled();
  });

  it("should set failed error message in case of errors", async () => {
    // Given
    when(jest.spyOn(inputs, 'load')).expectCalledWith().mockImplementationOnce(() => {
      throw new Error('Bim');
    });

    const setFailedSPy = jest.spyOn(core, 'setFailed');
    when(setFailedSPy).expectCalledWith('Bim').mockReturnValue();
  
    // When
    await main.run();

    // Then
    expect(setFailedSPy).toHaveBeenCalled();
  });
});