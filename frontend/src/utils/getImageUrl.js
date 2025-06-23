const getImageUrl = (originalUrl) => {
  const isLocal = window.location.hostname === "localhost";
  return isLocal
    ? `http://localhost:8000/proxy-image?url=${encodeURIComponent(originalUrl)}`
    : originalUrl;
};

export default getImageUrl; 