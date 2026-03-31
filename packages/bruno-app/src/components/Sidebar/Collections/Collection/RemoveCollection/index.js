import React, { useMemo } from 'react';
import toast from 'react-hot-toast';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import { IconAlertCircle } from '@tabler/icons';
import { removeCollection } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid, flattenItems, isItemARequest, hasRequestChanges } from 'utils/collections/index';
import filter from 'lodash/filter';
import ConfirmCollectionCloseDrafts from './ConfirmCollectionCloseDrafts';
import StyledWrapper from './StyledWrapper';

const RemoveCollection = ({ onClose, collectionUid }) => {
  const dispatch = useDispatch();
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));

  // Detect drafts in the collection
  const drafts = useMemo(() => {
    if (!collection) return [];
    const items = flattenItems(collection.items);
    return filter(items, (item) => isItemARequest(item) && hasRequestChanges(item));
  }, [collection]);

  const onConfirm = () => {
    if (!collection) {
      toast.error('未找到 Collection');
      onClose();
      return;
    }
    dispatch(removeCollection(collection.uid))
      .then(() => {
        toast.success('Collection 已从 Workspace 移除');
        onClose();
      })
      .catch(() => toast.error('移除 Collection 时发生错误'));
  };

  if (!collection) {
    return <div>未找到 Collection</div>;
  }

  // If there are drafts, show the draft confirmation modal
  if (drafts.length > 0) {
    return <ConfirmCollectionCloseDrafts onClose={onClose} collection={collection} collectionUid={collectionUid} />;
  }

  const customHeader = (
    <div className="flex items-center gap-2" data-testid="close-collection-modal-title">
      <IconAlertCircle size={18} strokeWidth={1.5} className="warning-icon" />
      <span>移除 Collection</span>
    </div>
  );

  // Otherwise, show the standard remove confirmation modal
  return (
    <StyledWrapper>
      <Modal
        size="sm"
        title="移除 Collection"
        customHeader={customHeader}
        confirmText="移除"
        confirmButtonColor="warning"
        handleConfirm={onConfirm}
        handleCancel={onClose}
      >
        <p className="mb-4">确定要在 Bruno 中关闭以下 Collection 吗？</p>
        <div className="collection-info-card">
          <div className="collection-name">{collection.name}</div>
          <div className="collection-path">{collection.pathname}</div>
        </div>
        <p className="mt-4 text-muted text-sm">
          它仍会保留在文件系统中的上述位置，可以稍后重新打开。
        </p>
      </Modal>
    </StyledWrapper>
  );
};

export default RemoveCollection;
