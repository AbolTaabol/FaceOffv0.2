(function () {

  var width = 320;
  var height = 0;

  var streaming = false;

  var video = null;
  var canvas = null;
  var photo = null;
  var startbutton = null;
  var overlay = null;


  Promise.all([

    faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
    faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
    faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
    faceapi.nets.faceExpressionNet.loadFromUri('/models')

  ]).then(startup)


  function startup() {

    video = document.getElementById('video');
    canvas = document.getElementById('canvas');
    photo = document.getElementById('photo');
    startbutton = document.getElementById('startbutton');
    overlay = document.getElementById("Outline.png");


    navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      })

      .then(function (stream) {
        video.srcObject = stream;
        video.play();
      })

      .catch(function (err) {
        console.log("An error occured: " + err);
      });

    if (isNaN(height)) {
      height = width / (4 / 3);
    }

    video.addEventListener('canplay', function (ev) {
      if (!streaming) {

        document.getElementById("status").innerHTML = "Starting...";
        height = video.videoHeight / (video.videoWidth / width);
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        video.setAttribute('width', width);
        video.setAttribute('height', height);
        streaming = true;

        const faceCanvas = faceapi.createCanvasFromMedia(video);
        document.getElementById("status").innerHTML = "Looking for faces...";
        const displaySize = {
          width: video.width,
          height: video.height

        }

        faceapi.matchDimensions(faceCanvas, displaySize)
        setInterval(async () => {
          const detections = await faceapi.detectSingleFace(video, new faceapi.TinyFaceDetectorOptions({
            scoreThreshold: 0.9
          })).withFaceLandmarks().withFaceExpressions().withFaceDescriptor()

          if (detections) {

            document.getElementById("status").innerHTML = "Face detected.";
            const landmarkPositions = detections.landmarks.getJawOutline();
            const resizedDetections = faceapi.resizeResults(detections, displaySize);

            let x = parseInt(landmarkPositions[0].x - landmarkPositions[16].x);
            let y = parseInt(landmarkPositions[0].y - landmarkPositions[16].y);
            let z = parseInt(Math.sqrt(Math.pow(x, 2) + Math.pow(y, 2)));

            if (z > 240 && z < 270) {

              console.log("Perfect!");
              document.getElementById("instructions").innerHTML = "Perfect!";
              takePicture();


              const ctx = canvas.getContext('2d');
              ctx.clearRect(0, 0, canvas.width, canvas.height);

              faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
              faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

            } else {

              if (z <= 240) {

                document.getElementById("instructions").innerHTML = "Come close!";
                const ctx = canvas.getContext('2d');
                ctx.drawImage(overlay, 10, 10);
                console.log("Come close!");

              } else {

                document.getElementById("instructions").innerHTML = "Go back!";
                const ctx = canvas.getContext('2d');
                ctx.drawImage(overlay, 10, 10);
                console.log("Go back!")

              };
            }
          }
        }, 50)
      }
    }, false);

    startbutton.addEventListener('click', function (ev) {
      takePicture();
      ev.preventDefault();
    }, false);

    clearPhoto();

  }

  function clearPhoto() {

    var context = canvas.getContext('2d');
    context.fillStyle = "#AAA";
    context.fillRect(0, 0, canvas.width, canvas.height);

    var data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);

  }

  function takePicture() {

    document.getElementById("instructions").innerHTML = "Taking Picture!";
    var context = canvas.getContext('2d');
    if (width && height) {
      canvas.width = width;
      canvas.height = height;
      context.drawImage(video, 0, 0, width, height);

      var data = canvas.toDataURL('image/png');
      photo.setAttribute('src', data);
    } else {
      clearPhoto();
    }
  }

})();