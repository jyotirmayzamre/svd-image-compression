import Swal from "sweetalert2";

export default function sendErrorNotif(msg: string): void {
    Swal.fire({
      title: 'Error!',
      text: msg,
      icon: 'error',
      showConfirmButton: false,
      toast: true,
      timer: 3000,
      position: 'top'
    })
}