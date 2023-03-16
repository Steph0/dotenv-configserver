
const path = require('path');
const environmentFile = require('../src/environment-file');

describe('Build environment filename', () => {

  const ROOT = '/notarealfolder';
  const DIRECTORY = 'subfolder';
  const DEFAULT_DOTENV_FILENAME = '.env';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([undefined, null, "", " "])("should reject invalid filenames", (invalidFilenames) => {
    // Given, When, Then
    expect(() => environmentFile.buildEnvFilename(ROOT, DIRECTORY, invalidFilenames)).toThrow("You must provide a filename");
  });

  describe('Without optional profile name', () => {

    it("should allow env file to have only an extension", () => {

      // Given, When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, DEFAULT_DOTENV_FILENAME);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${DEFAULT_DOTENV_FILENAME}`);
    });

    it("should allow env file to have a filename + extension", () => {

      // Given
      const dotEnvFilename = 'myservice.env';

      // When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, dotEnvFilename);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${dotEnvFilename}`);
    });

    it("should allow filename without extension", () => {

      // Given
      const dotEnvFilenameNamePart = 'anotherservice';

      // When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, `${dotEnvFilenameNamePart}`);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${dotEnvFilenameNamePart}`);
    });
  });

  describe('With a profile', () => {

    const PROFILE = 'prod';

    it("should build a '<profile>.<extension>' filename", () => {

      // Given, When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, DEFAULT_DOTENV_FILENAME, PROFILE);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${PROFILE}${DEFAULT_DOTENV_FILENAME}`);
    });

    it("should allow filename without extension and build a '<profile>-<filename>' filename", () => {

      // Given
      const dotEnvFilenameNamePart = 'anotherservice';

      // When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, `${dotEnvFilenameNamePart}`, PROFILE);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${dotEnvFilenameNamePart}-${PROFILE}`);
    });

    it("should build a '<filename>-<profile>.<extension>' filename", () => {

      // Given
      const dotEnvFilenameNamePart = "anotherservice";
      const dotEnvFilenameExtension = ".toto";

      // When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, `${dotEnvFilenameNamePart}${dotEnvFilenameExtension}`, PROFILE);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${dotEnvFilenameNamePart}-${PROFILE}${dotEnvFilenameExtension}`);
    });

    it("should allow env file to have only an extension and build a '<profile>.<extension>' filename", () => {

      // Given
      const dotEnvFilenameNamePart = "anotherservice";
      const dotEnvFilenameExtension = ".toto";

      // When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, `${dotEnvFilenameNamePart}${dotEnvFilenameExtension}`, PROFILE);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${dotEnvFilenameNamePart}-${PROFILE}${dotEnvFilenameExtension}`);
    });

    it("should allow env file to have only a '<profile>' filename", () => {

      // Given, When
      const filename = environmentFile.buildEnvFilename(ROOT, DIRECTORY, '', PROFILE);

      // Then
      expect(filename).toEqual(`${ROOT}/${DIRECTORY}/${PROFILE}`);
    });
  });
});

describe('Load environment file', () => {

  it("should load input environment file", () => {

    // Given
    const dotEnvFileStub = path.join(path.resolve('test/resources/stubs'), 'toto.env');

    // When
    const results = environmentFile.loadDotenvFile(dotEnvFileStub);

    // Then
    expect(results).toEqual({
      author: 'Steph0'
    });
  });

  it("should load input environement file even if not a .env file", () => {

    // Given
    const dotEnvFileStub = path.join(path.resolve('test/resources/stubs'), 'toto.other');

    // When
    const results = environmentFile.loadDotenvFile(dotEnvFileStub);

    // Then
    expect(results).toEqual({
      product: 'dotenv-configserver'
    });
  });
});