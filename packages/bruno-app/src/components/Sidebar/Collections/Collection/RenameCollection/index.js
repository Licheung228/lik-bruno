import React, { useRef, useEffect } from 'react';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Modal from 'components/Modal';
import { useDispatch, useSelector } from 'react-redux';
import toast from 'react-hot-toast';
import { renameCollection } from 'providers/ReduxStore/slices/collections/actions';
import { findCollectionByUid } from 'utils/collections/index';

const RenameCollection = ({ collectionUid, onClose }) => {
  const dispatch = useDispatch();
  const inputRef = useRef();
  const collection = useSelector((state) => findCollectionByUid(state.collections.collections, collectionUid));
  const formik = useFormik({
    enableReinitialize: true,
    initialValues: {
      name: collection.name
    },
    validationSchema: Yup.object({
      name: Yup.string()
        .min(1, '至少需要 1 个字符')
        .required('名称必填')
    }),
    onSubmit: (values) => {
      dispatch(renameCollection(values.name, collection.uid))
        .then(() => {
          toast.success('Collection 已重命名！');
          onClose();
        })
        .catch((err) => {
          toast.error(err ? err.message : '重命名 Collection 时发生错误');
        });
    }
  });

  useEffect(() => {
    if (inputRef && inputRef.current) {
      inputRef.current.focus();
    }
  }, [inputRef]);

  const onSubmit = () => formik.handleSubmit();

  return (
    <Modal size="md" title="重命名 Collection" confirmText="重命名" handleConfirm={onSubmit} handleCancel={onClose}>
      <form className="bruno-form" onSubmit={(e) => e.preventDefault()}>
        <div>
          <label htmlFor="name" className="block font-medium">
            名称
          </label>
          <input
            id="collection-name"
            type="text"
            name="name"
            ref={inputRef}
            className="block textbox mt-2 w-full"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            spellCheck="false"
            onChange={formik.handleChange}
            value={formik.values.name || ''}
          />
          {formik.touched.name && formik.errors.name ? <div className="text-red-500">{formik.errors.name}</div> : null}
        </div>
      </form>
    </Modal>
  );
};

export default RenameCollection;
