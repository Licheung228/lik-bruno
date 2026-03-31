import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Portal from 'components/Portal';
import Modal from 'components/Modal';
import { useDispatch } from 'react-redux';
import {
  getCollectionGitOverview,
  gitFetch,
  gitPull,
  gitPush
} from 'providers/ReduxStore/slices/collections/actions';
import StyledWrapper from './StyledWrapper';
import Button from 'ui/Button';
import { uuid } from 'utils/common';

const GitAction = ({ collectionUid, onClose }) => {
  const dispatch = useDispatch();
  const [overview, setOverview] = useState(null);
  const [loadingOverview, setLoadingOverview] = useState(true);
  const [isOperating, setIsOperating] = useState(false);
  const [lastResult, setLastResult] = useState(null);

  const loadOverview = useCallback(async () => {
    setLoadingOverview(true);
    try {
      const data = await dispatch(getCollectionGitOverview(collectionUid));
      setOverview(data);
    } catch (err) {
      const message = err?.message || 'Failed to load Git information';
      setLastResult({
        type: 'error',
        message
      });
    } finally {
      setLoadingOverview(false);
    }
  }, [collectionUid, dispatch]);

  useEffect(() => {
    loadOverview();
  }, [loadOverview]);

  const runOperation = async (operationLabel, action, successMessage) => {
    setIsOperating(true);
    setLastResult(null);
    const processUid = uuid();

    try {
      await dispatch(action(collectionUid, processUid));
      setLastResult({
        type: 'success',
        message: successMessage
      });
      toast.success(successMessage);
      await loadOverview();
    } catch (err) {
      const message = err?.message || `${operationLabel} failed`;
      setLastResult({
        type: 'error',
        message
      });
      toast.error(message);
    } finally {
      setIsOperating(false);
    }
  };

  const renderContent = () => {
    if (loadingOverview) {
      return <div className="text-sm text-muted">Loading Git information...</div>;
    }

    if (!overview) {
      return <div className="text-sm text-danger">Unable to load Git information.</div>;
    }

    return (
      <>
        <div className="git-info-card">
          <div className="info-row">
            <span className="label">Current Branch</span>
            <span className="value">{overview.currentBranch || '-'}</span>
          </div>
          <div className="info-row">
            <span className="label">Remote (origin)</span>
            <span className="value value-url">{overview.remoteUrl || '-'}</span>
          </div>
          <div className="info-row">
            <span className="label">Ahead</span>
            <span className="value">{overview.ahead ?? 0}</span>
          </div>
          <div className="info-row">
            <span className="label">Behind</span>
            <span className="value">{overview.behind ?? 0}</span>
          </div>
        </div>

        {lastResult && (
          <div className={`result-message ${lastResult.type === 'error' ? 'error' : 'success'}`}>
            {lastResult.message}
          </div>
        )}

        <div className="git-actions">
          <Button
            type="button"
            disabled={isOperating}
            onClick={() => runOperation('Fetch', gitFetch, 'Fetch completed')}
          >
            {isOperating ? 'Running...' : 'Fetch'}
          </Button>
          <Button
            type="button"
            disabled={isOperating}
            onClick={() => runOperation('Pull', gitPull, 'Pull completed')}
          >
            {isOperating ? 'Running...' : 'Pull'}
          </Button>
          <Button
            type="button"
            disabled={isOperating}
            onClick={() => runOperation('Push', gitPush, 'Push completed')}
          >
            {isOperating ? 'Running...' : 'Push'}
          </Button>
        </div>
      </>
    );
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal size="md" title="Git Actions" hideFooter={true} handleCancel={onClose}>
          <div className="git-action-modal-content">
            {renderContent()}
            <div className="flex justify-end mt-6">
              <Button type="button" color="secondary" variant="ghost" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default GitAction;
