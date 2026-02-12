import { Room } from '@/types/room';

export const downloadRoomAsPng = async (canvasElement: HTMLElement, roomName: string) => {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(canvasElement, {
    backgroundColor: null,
    scale: 2,
  });
  const link = document.createElement('a');
  link.download = `${roomName.replace(/\s+/g, '-').toLowerCase()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
};

export const printRoom = async (canvasElement: HTMLElement) => {
  const { default: html2canvas } = await import('html2canvas');
  const canvas = await html2canvas(canvasElement, {
    backgroundColor: null,
    scale: 2,
  });
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;
  printWindow.document.write(`
    <html><head><title>Room Plan</title></head>
    <body style="margin:0;display:flex;justify-content:center;align-items:center;min-height:100vh;background:#fff;">
      <img src="${canvas.toDataURL('image/png')}" style="max-width:100%;height:auto;" />
    </body></html>
  `);
  printWindow.document.close();
  printWindow.onload = () => {
    printWindow.print();
  };
};
