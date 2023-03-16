const github = require('@actions/github');
const fs = require('fs');
const io = require('@actions/io');
const tc = require('@actions/tool-cache');
require('uuid');
const FAKEUID = 'fakeuid';
jest.mock('uuid', () => ({v4: () => FAKEUID}));
const when = require('jest-when').when;
const verifyAllWhenMocksCalled = require('jest-when').verifyAllWhenMocksCalled;
const fetchConfigserver = require('../src/fetch-configserver');

describe('Fetch configserver repository', () => {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should return the configserver local filepath", async () => {

    // Given
    process.platform = 'linux'
    const token = 'xxxxx';
    const owner = 'Steph0';
    const repo = 'dotenv-configserver';
    const branch = 'main';
    const destination = '/notafolder';

    const ioMkdirSpy = jest.spyOn(io, 'mkdirP');
    when(ioMkdirSpy)
      .expectCalledWith(destination)
      .mockReturnValueOnce();

    const downloadArchiveSpy = jest.fn();
    when(downloadArchiveSpy)
      .expectCalledWith({
        owner: owner,
        repo: repo,
        ref: branch
      })
      .mockReturnValueOnce({
        status: 200,
        data: "data"
      });

    const githubSpy = jest.spyOn(github, 'getOctokit');
    when(githubSpy)
      .expectCalledWith(token)
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
    const expectedArchiveFilePath = `${destination}/archive-${repo}-${FAKEUID}.tar.gz`;
    when(writeFileSpy)
      .expectCalledWith(expectedArchiveFilePath, expect.anything())
      .mockResolvedValue();

    const tcSpy = jest.spyOn(tc, 'extractTar');
    when(tcSpy)
      .expectCalledWith(expectedArchiveFilePath, `${destination}/${repo}-${FAKEUID}`)
      .mockResolvedValue();

    const ioRmSpy = jest.spyOn(io, 'rmRF');
    when(ioRmSpy)
      .expectCalledWith(expectedArchiveFilePath)
      .mockReturnValueOnce();

    const readDirSpy = jest.fn();
    fs.promises.readdir = readDirSpy;
    when(readDirSpy)
      .expectCalledWith(`${destination}/${repo}-${FAKEUID}`)
      .mockResolvedValue([destination]);

    // When
    const configServerPath = await fetchConfigserver.cloneDotenvConfig(owner, repo, branch, token, destination);

    // Then
    verifyAllWhenMocksCalled();
    expect(configServerPath).toEqual(`${destination}/${repo}-${FAKEUID}${destination}`);
  });

  it("should return the configserver local filepath", async () => {

    // Given
    process.platform = 'linux'
    const token = 'xxxxx';
    const owner = 'Steph0';
    const repo = 'dotenv-configserver';
    const branch = 'main';
    const destination = '/notafolder';

    const ioMkdirSpy = jest.spyOn(io, 'mkdirP');
    when(ioMkdirSpy)
      .expectCalledWith(destination)
      .mockReturnValueOnce();

    const downloadArchiveSpy = jest.fn();
    when(downloadArchiveSpy)
      .expectCalledWith({
        owner: owner,
        repo: repo,
        ref: branch
      })
      .mockReturnValueOnce({
        status: 404,
        data: undefined
      });

    const githubSpy = jest.spyOn(github, 'getOctokit');
    when(githubSpy)
      .expectCalledWith(token)
      .mockReturnValueOnce({
        rest: {
          repos: {
            downloadZipballArchive: downloadArchiveSpy,
            downloadTarballArchive: downloadArchiveSpy,
          }
        }
      });

    // When, Then
    await expect(async () => await fetchConfigserver.cloneDotenvConfig(owner, repo, branch, token, destination))
    .rejects
    .toThrow(`Enable to fetch repository. HTTP:[404], content:[undefined]`);
  });
});