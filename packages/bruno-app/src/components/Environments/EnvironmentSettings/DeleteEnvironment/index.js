import React from 'react';
import Portal from 'components/Portal/index';
import toast from 'react-hot-toast';
import Modal from 'components/Modal/index';
import { deleteEnvironment } from 'providers/ReduxStore/slices/collections/actions';
import { useDispatch } from 'react-redux';
import StyledWrapper from './StyledWrapper';

const DeleteEnvironment = ({ onClose, environment, collection }) => {
  const dispatch = useDispatch();
  const onConfirm = () => {
    dispatch(deleteEnvironment(environment.uid, collection.uid))
      .then(() => {
        toast.success('Environment 已成功删除');
        onClose();
      })
      .catch(() => toast.error('删除 Environment 时发生错误'));
  };

  return (
    <Portal>
      <StyledWrapper>
        <Modal
          size="sm"
          title="删除 Environment"
          confirmText="删除"
          handleConfirm={onConfirm}
          handleCancel={onClose}
          confirmButtonColor="danger"
        >
          确定要删除 <span className="font-medium">{environment.name}</span> 吗？
        </Modal>
      </StyledWrapper>
    </Portal>
  );
};

export default DeleteEnvironment;
