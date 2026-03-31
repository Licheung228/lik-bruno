import React, { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconAlertTriangle } from '@tabler/icons';
import { removeCollectionFromWorkspaceAction } from 'providers/ReduxStore/slices/workspaces/actions';
import { findCollectionByUid } from 'utils/collections/index';
import StyledWrapper from './StyledWrapper';

const DeleteCollection = ({ onClose, collectionUid, workspaceUid }) => {
  const dispatch = useDispatch();
  const [confirmText, setConfirmText] = useState('');
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const workspace = useSelector((state) => state.workspaces.workspaces.find((w) => w.uid === workspaceUid));

  const isConfirmed = confirmText.toLowerCase() === 'delete';

  const onConfirm = async () => {
    if (!collection || !workspace) {
      toast.error('未找到 Collection 或 Workspace');
      onClose();
      return;
    }

    try {
      await dispatch(removeCollectionFromWorkspaceAction(workspace.uid, collection.pathname, { deleteFiles: true }));
      toast.success(`已删除 "${collection.name}" Collection`);
      onClose();
    } catch (error) {
      console.error('Error deleting collection:', error);
      toast.error(error.message || '删除 Collection 时发生错误');
    }
  };

  if (!collection) {
    return null;
  }

  const customHeader = (
    <div className="flex items-center gap-2">
      <IconAlertTriangle size={18} strokeWidth={1.5} className="text-red-500" />
      <span>删除 Collection</span>
    </div>
  );

  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title="删除 Collection"
        customHeader={customHeader}
        confirmText="删除"
        cancelText="取消"
        confirmButtonColor="danger"
        confirmDisabled={!isConfirmed}
        handleConfirm={onConfirm}
        handleCancel={onClose}
      >
        <p className="modal-description">
          确定要永久删除 <strong>"{collection.name}"</strong> 吗？
        </p>
        <div className="collection-info-card">
          <div className="collection-name">{collection.name}</div>
          <div className="collection-path">{collection.pathname}</div>
        </div>
        <p className="warning-text">
          此操作不可撤销。Collection 文件将从磁盘中永久删除。
        </p>
        <div className="delete-confirmation">
          <label htmlFor="delete-confirm-input">
            输入 <span className="delete-keyword">delete</span> 以确认
          </label>
          <input
            id="delete-confirm-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder="delete"
            autoComplete="off"
            autoFocus
          />
        </div>
      </Modal>
    </StyledWrapper>
  );
};

export default DeleteCollection;
