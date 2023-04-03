const when = require('jest-when').when;
const io = require('@actions/io');
const cleanup = require('../src/cleanup');

describe('Cleanup', () => {

  const FOLDER = '/notafolder';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([undefined, null, "", " "])("should reject invalid filenames", async (invalidFilenames) => {
    // Given
    const ioRmSpy = jest.spyOn(io, 'rmRF');
    when(ioRmSpy).resetWhenMocks();

    // When, Then
    await expect(async () => await cleanup.cleanup(invalidFilenames)).rejects.toThrow('Could not find a config directory to delete');

    // Then
    expect(ioRmSpy).not.toHaveBeenCalled();
  });

  it("should not clean anything if perform as been marked as 'false'", async () => {
    // Given
    const ioRmSpy = jest.spyOn(io, 'rmRF');
    when(ioRmSpy).resetWhenMocks();
    
    // When
    await cleanup.cleanup(FOLDER, false);

    // Then
    expect(ioRmSpy).not.toHaveBeenCalled();
  });

  it("should perform a cleanup of configserver files", async () => {
    // Given
    const ioRmSpy = jest.spyOn(io, 'rmRF');
    when(ioRmSpy)
      .expectCalledWith(FOLDER)
      .mockResolvedValue();
    
    // When, Then
    await cleanup.cleanup(FOLDER, true);
  });
});