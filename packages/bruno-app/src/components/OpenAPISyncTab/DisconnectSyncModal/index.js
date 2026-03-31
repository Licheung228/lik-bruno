import Button from 'ui/Button';
import Modal from 'components/Modal';

const DisconnectSyncModal = ({ onConfirm, onClose }) => {
  return (
    <Modal
      size="sm"
      title="断开同步"
      hideFooter={true}
      handleCancel={onClose}
    >
      <div className="disconnect-modal">
        <p className="disconnect-message">
          <>确定要断开 OpenAPI 同步吗？ </> <br /> <br />
          <>此操作仅断开同步配置，你的 Collection 将保持不变。</>
        </p>
        <div className="disconnect-actions">
          <Button variant="ghost" color="secondary" onClick={onClose}>
            取消
          </Button>
          <Button color="danger" onClick={onConfirm}>
            断开
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default DisconnectSyncModal;
