"use client";
import { Modal } from "@/shared/components/modal";
import { useSidebarStore } from "@/stores/sidebar.store";
import { useEffect, useState } from "react";
import { AddEmployee } from "./add.employee";
import { ACTION, MODAL_ACTION } from "@/lib/constants";

const ModalContainer = ({ url }: { url?: string }) => {
  const { value, setValue } = useSidebarStore();
  const [open, setOpen] = useState<undefined | boolean>(undefined);
  const [action, setAction] = useState(ACTION.DEFAULT);
  function renderModalContent(value: any) {
    if (!value) return null;

    if (value === MODAL_ACTION.add_emp) {
      return <AddEmployee action={action} setAction={setAction} />;
    }

    return <p>Алдаатай эсвэл тодорхойгүй утга</p>;
  }
  useEffect(() => {
    if (value != undefined) setOpen(true);
  }, [value]);
  return (
    <div>
      {/* {value} */}
      <Modal
        open={open == true}
        setOpen={(v) => {
          if (!v) {
            setOpen(v);
            setValue(undefined);
          }
        }}
        name={""}
      >
        {renderModalContent(value)}
      </Modal>
    </div>
  );
};

export default ModalContainer;
