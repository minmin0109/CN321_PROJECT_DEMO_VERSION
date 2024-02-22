(function () {
    let receiverID;
    const socket = new WebSocket("ws://localhost:7460"); // Change the URL to match your WebSocket server address

    socket.addEventListener("open", function (event) {
        console.log("Connected to WebSocket server");
    });

    function generateID() {
        return `${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}-${Math.trunc(Math.random() * 999)}`;
    }

    document.querySelector("#sender-start-con-btn").addEventListener("click", function () {
        let joinID = generateID();
        document.querySelector('#join-id').innerHTML = `
            <b>Room ID </b>
            <span>${joinID}</span>
        `;
        socket.send(JSON.stringify({ type: "sender-join", uid: joinID }));
    });

    socket.addEventListener("message", function (event) {
        const data = JSON.parse(event.data);
        console.log(data)
        switch (data.type) {
            case "init":
                receiverID = data.uid;
                document.querySelector(".join-screen").classList.remove("active");
                document.querySelector(".fs-screen").classList.add("active");
                break;
            default:
                break;
        }
    });

    document.querySelector("#file-input").addEventListener("change", function (e) {
        let file = e.target.files[0];
        if (!file) {
            return;
        }

        let reader = new FileReader();
        reader.onload = function (e) {
            let buffer = new Uint8Array(reader.result);
            let el = document.createElement("div");
            el.classList.add("item");
            el.innerHTML = `
                <div class= "progress"> 0% </div>
                <div class= "filename"> ${file.name} </div>
            `;
            document.querySelector(".file-list").appendChild(el);
            shareFile({
                filename: file.name,
                total_buffer_size: buffer.length,
                buffer_size: 1024
            }, buffer, el.querySelector(".progress"));
        }
        reader.readAsArrayBuffer(file);
    });

    function shareFile(metadata, buffer, progress_node) {
        socket.send(JSON.stringify({ type: "file-meta", uid: receiverID, metadata: metadata }));

        function sendChunk() {
            if (buffer.length === 0) {
                return;
            }

            let chunk = buffer.slice(0, metadata.buffer_size);
            buffer = buffer.slice(metadata.buffer_size);

            console.log('chunk: ', chunk, buffer);

            progress_node.innerText = Math.trunc((metadata.total_buffer_size - buffer.length) / metadata.total_buffer_size * 100) + "%";
                  
            // socket.send(JSON.stringify({ type: "file-raw", uid: receiverID, buffer: chunk }));
            socket.send(JSON.stringify({ type: "file-raw", uid: receiverID, buffer: Array.from(chunk) }));
            
            setTimeout(sendChunk, 0);
        }
        sendChunk();
    }

})();