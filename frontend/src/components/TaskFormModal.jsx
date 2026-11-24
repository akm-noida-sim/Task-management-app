import Modal from './Modal';
import TaskForm from './TaskForm';

export default function TaskFormModal({ open, onClose, onSubmit, apiError = '', initialValues }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New task"
      description="Add a task to your workspace. You can edit it any time."
    >
      <TaskForm onSubmit={onSubmit} onCancel={onClose} apiError={apiError} initialValues={initialValues} />
    </Modal>
  );
}
