const github = require('@actions/github');
const fs = require('fs');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
require('uuid');
const FAKEUID = 'fakeuid';
jest.mock('uuid', () => ({v4: () => FAKEUID}));
const when = require('jest-when').when;
const verifyAllWhenMocksCalled = require('jest-when').verifyAllWhenMocksCalled;
const configserver = require('../src/configserver');

describe('Fetch configserver repository', () => {

  const TOKEN = 'xxxxx';
  const OWNER = 'Steph0';
  const REPO = 'dotenv-configserver';
  const BRANCH = 'main';
  const DESTINATION = '/notafolder';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the configserver local filepath", async () => {

    // Given
    process.platform = 'linux'

    const ioMkdirSpy = jest.spyOn(io, 'mkdirP');
    when(ioMkdirSpy)
      .expectCalledWith(DESTINATION)
      .mockReturnValueOnce();

    const downloadArchiveSpy = jest.fn();
    when(downloadArchiveSpy)
      .expectCalledWith({
        owner: OWNER,
        repo: REPO,
        ref: BRANCH
      })
      .mockReturnValueOnce({
        status: 200,
        data: "data"
      });

    const githubSpy = jest.spyOn(github, 'getOctokit');
    when(githubSpy)
      .expectCalledWith(TOKEN)
      .mockReturnValueOnce({
        rest: {
          repos: {
            downloadZipballArchive: downloadArchiveSpy,
            downloadTarballArchive: downloadArchiveSpy,
          }
        }
      });

    const writeFileSpy = jest.fn();
    fs.promises.writeFile = writeFileSpy;
    const expectedArchiveFilePath = `${DESTINATION}/archive-${REPO}-${FAKEUID}.tar.gz`;
    when(writeFileSpy)
      .expectCalledWith(expectedArchiveFilePath, expect.anything())
      .mockResolvedValue();

    const tcSpy = jest.spyOn(tc, 'extractTar');
    when(tcSpy)
      .expectCalledWith(expectedArchiveFilePath, `${DESTINATION}/${REPO}-${FAKEUID}`)
      .mockResolvedValue();

    const ioRmSpy = jest.spyOn(io, 'rmRF');
    when(ioRmSpy)
      .expectCalledWith(expectedArchiveFilePath)
      .mockReturnValueOnce();

    const readDirSpy = jest.fn();
    fs.promises.readdir = readDirSpy;
    when(readDirSpy)
      .expectCalledWith(`${DESTINATION}/${REPO}-${FAKEUID}`)
      .mockResolvedValue([DESTINATION]);

    // When
    const configServerPath = await configserver.fetch(OWNER, REPO, BRANCH, TOKEN, DESTINATION);

    // Then
    verifyAllWhenMocksCalled();
    expect(configServerPath).toEqual(`${DESTINATION}/${REPO}-${FAKEUID}${DESTINATION}`);
  });

  it("should return the configserver local filepath", async () => {

    // Given
    process.platform = 'linux'

    const ioMkdirSpy = jest.spyOn(io, 'mkdirP');
    when(ioMkdirSpy)
      .expectCalledWith(DESTINATION)
      .mockReturnValueOnce();

    const downloadArchiveSpy = jest.fn();
    when(downloadArchiveSpy)
      .expectCalledWith({
        owner: OWNER,
        repo: REPO,
        ref: BRANCH
      })
      .mockReturnValueOnce({
        status: 404,
        data: undefined
      });

    const githubSpy = jest.spyOn(github, 'getOctokit');
    when(githubSpy)
      .expectCalledWith(TOKEN)
      .mockReturnValueOnce({
        rest: {
          repos: {
            downloadZipballArchive: downloadArchiveSpy,
            downloadTarballArchive: downloadArchiveSpy,
          }
        }
      });

    // When, Then
    await expect(async () => await configserver.fetch(OWNER, REPO, BRANCH, TOKEN, DESTINATION))
      .rejects
      .toThrow(`Enable to fetch repository. HTTP:[404], content:[undefined]`);
  });
});