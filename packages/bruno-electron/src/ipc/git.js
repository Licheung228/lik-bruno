const { ipcMain } = require('electron');
const {
  cloneGitRepository,
  getCollectionGitRootPath,
  getCollectionGitData,
  getAheadBehindCount,
  fetchChanges,
  pullGitChanges,
  pushGitChanges,
  stageChanges,
  commitChanges
} = require('../utils/git');
const { createDirectory, removeDirectory } = require('../utils/filesystem');

const getCollectionGitContext = async (collectionPath) => {
  const gitRootPath = getCollectionGitRootPath(collectionPath);
  if (!gitRootPath) {
    throw new Error('This collection is not in a Git repository');
  }

  const gitData = await getCollectionGitData(gitRootPath, collectionPath);
  const currentBranch = gitData?.currentGitBranch;

  if (!currentBranch) {
    throw new Error('Unable to determine current Git branch');
  }

  return {
    gitRootPath,
    currentBranch,
    remoteUrl: gitData?.gitRepoUrl || ''
  };
};

const formatTimestamp = (date = new Date()) => {
  const pad = (value) => String(value).padStart(2, '0');
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hours = pad(date.getHours());
  const minutes = pad(date.getMinutes());
  const seconds = pad(date.getSeconds());
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};

const isNothingToCommitError = (error) => {
  const message = error?.message || '';
  return message.includes('nothing to commit') || message.includes('no changes added to commit');
};

const registerGitIpc = (mainWindow) => {
  ipcMain.handle('renderer:clone-git-repository', async (event, { url, path, processUid }) => {
    let directoryCreated = false;
    try {
      await createDirectory(path);
      directoryCreated = true;
      await cloneGitRepository(mainWindow, { url, path, processUid });
      return 'Repository cloned successfully';
    } catch (error) {
      if (directoryCreated) {
        await removeDirectory(path);
      }
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:get-collection-git-overview', async (event, { collectionPath }) => {
    try {
      const { gitRootPath, currentBranch, remoteUrl } = await getCollectionGitContext(collectionPath);
      const aheadBehind = await getAheadBehindCount(gitRootPath);

      return {
        gitRootPath,
        currentBranch,
        remoteUrl,
        ahead: aheadBehind?.ahead || 0,
        behind: aheadBehind?.behind || 0
      };
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:git-fetch', async (event, { collectionPath }) => {
    try {
      const { gitRootPath } = await getCollectionGitContext(collectionPath);
      await fetchChanges(gitRootPath, 'origin');
      return 'Fetch completed successfully';
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:git-pull', async (event, { collectionPath, processUid, strategy = '--no-rebase' }) => {
    try {
      const { gitRootPath, currentBranch } = await getCollectionGitContext(collectionPath);
      await pullGitChanges(mainWindow, {
        gitRootPath,
        processUid,
        remote: 'origin',
        remoteBranch: currentBranch,
        strategy
      });
      return 'Pull completed successfully';
    } catch (error) {
      return Promise.reject(error);
    }
  });

  ipcMain.handle('renderer:git-push', async (event, { collectionPath, processUid }) => {
    try {
      const { gitRootPath, currentBranch } = await getCollectionGitContext(collectionPath);
      await stageChanges(gitRootPath, ['.']);
      try {
        await commitChanges(gitRootPath, formatTimestamp());
      } catch (error) {
        if (!isNothingToCommitError(error)) {
          throw error;
        }
      }
      await pushGitChanges(mainWindow, {
        gitRootPath,
        processUid,
        remote: 'origin',
        remoteBranch: currentBranch
      });
      return 'Push completed successfully';
    } catch (error) {
      return Promise.reject(error);
    }
  });
};

module.exports = registerGitIpc;
