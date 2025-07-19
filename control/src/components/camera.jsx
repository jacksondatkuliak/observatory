const headers = {
  Authorization: "Basic " + btoa("user:" + config.key),
  "Content-Type": "application/json",
};
axios
  .post(
    config.socketUrl + "/api/v1/camera/capture",
    { ExposureTime: 1.0 },
    {
      headers: headers,
    }
  )
  .then((response) => {
    console.log("Success:", response.data);
  })
  .catch((error) => {
    console.error("Error:", error);
  });
