import React from 'react';
import Modal from 'components/Modal';
import { isItemAFolder } from 'utils/tabs';
import { useDispatch } from 'react-redux';
import { deleteItem, closeTabs } from 'providers/ReduxStore/slices/collections/actions';
import { recursivelyGetAllItemUids } from 'utils/collections';
import StyledWrapper from './StyledWrapper';
import toast from 'react-hot-toast';

const DeleteCollectionItem = ({ onClose, item, collectionUid }) => {
  const dispatch = useDispatch();
  const isFolder = isItemAFolder(item);
  const onConfirm = () => {
    dispatch(deleteItem(item.uid, collectionUid)).then(() => {
      if (isFolder) {
        // close all tabs that belong to the folder
        // including the folder itself and its children
        const tabUids = [...recursivelyGetAllItemUids(item.items), item.uid];

        dispatch(
          closeTabs({
            tabUids: tabUids
          })
        );
      } else {
        dispatch(
          closeTabs({
            tabUids: [item.uid]
          })
        );
      }
    }).catch((error) => {
      console.error('Error deleting item', error);
      toast.error(error?.message || '删除项目时发生错误');
    });
    onClose();
  };

  return (
    <StyledWrapper>
      <Modal
        size="md"
        title={`删除 ${isFolder ? 'Folder' : 'Request'}`}
        confirmText="删除"
        confirmButtonColor="danger"
        handleConfirm={onConfirm}
        handleCancel={onClose}
      >
        确定要删除 <span className="font-medium">{item.name}</span> 吗？
      </Modal>
    </StyledWrapper>
  );
};

export default DeleteCollectionItem;
