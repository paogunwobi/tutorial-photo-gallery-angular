
export function ToURI(imgUrlStr: string): any {
  let imageURI = '';
  if (imgUrlStr && imgUrlStr.includes("data:image/png;base64,")) {
    imageURI = imgUrlStr.replace("data:image/png;base64,", "");
  }

  if (imgUrlStr && imgUrlStr.includes("data:image/jpeg;base64,")) {
    imageURI = imgUrlStr.replace("data:image/jpeg;base64,", "");
  }

  return imageURI;
}
