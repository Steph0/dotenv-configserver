const when = require('jest-when').when;
const verifyAllWhenMocksCalled = require('jest-when').verifyAllWhenMocksCalled;
const core = require('@actions/core');
const outputs = require('../src/outputs');

describe('Outputs', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('As GITHUB_ENV', () => {

    it("should export nothing as env variables", () => {

      // Given
      const exportVariableSpy = jest.spyOn(core, 'exportVariable');

      // When
      outputs.exportToGithubEnv();

      //Then
      expect(exportVariableSpy).not.toHaveBeenCalled();
    });

    it("should export data as env variables", () => {

      // Given
      const data = {test: 'exportVariable'};
      const exportVariableSpy = jest.spyOn(core, 'exportVariable');
      when(exportVariableSpy)
        .expectCalledWith('test', 'exportVariable');

      // When
      outputs.exportToGithubEnv(data);

      //Then
      verifyAllWhenMocksCalled();
    });

  });


  describe('As action outputs', () => {
    it("should export nothing as action outputs", () => {

      // Given
      const exportVariableSpy = jest.spyOn(core, 'exportVariable');

      // When
      outputs.exportToOutput();

      //Then
      expect(exportVariableSpy).not.toHaveBeenCalled();
    });


    it("should export data as action output", () => {

      // Given
      const data = {test: 'setOutput'};
      const exportVariableSpy = jest.spyOn(core, 'setOutput');
      when(exportVariableSpy)
        .expectCalledWith('test', 'setOutput');

      // When
      outputs.exportToOutput(data);

      //Then
      verifyAllWhenMocksCalled();
    });
  });
});