let Peer = require('simple-peer')
let socket = io()
const video = document.querySelector('video')
let client = {}

//video streaming user permission
navigator.mediaDevices.getUserMedia({ video:true, audio:true })
.then(stream => {
    socket.emit('NewClient')
    video.srcObject = stream
    video.play()

    //initialisse a peer 
    function InitPeer(type){
        let peer = new Peer({initiator:(type == 'init') ? true:false, stream:stream, trickle:false})
        peer.on('stream', function(stream){
            CreateVideo(stream)
        })
        peer.on('close', function(){
            document.getElementById("peerVideo").remove();
            peer.destroy()
        })
        peer.on('data', function (data) {
            let decodedData = new TextDecoder('utf-8').decode(data)
            let peervideo = document.querySelector('#peerVideo')
            peervideo.style.filter = decodedData
        })
        return peer
    }

    function RemoveVideo(){
        document.getElementById("peerVideo").remove();
    }

    //this is called when peer sends an offer 
    function MakePeer(){
        client.gotAnswer = false
        let peer = InitPeer('init')
        peer.on('signal', function(data){
            if(!client.gotAnswer){
                socket.emit('Offer',data)
            }
        })
        client.peer = peer
    }

    ///when we get an offer from a client and send an answer
    function FrontAnswer(offer){
        let peer = InitPeer('notInit')
        peer.on('signal', (data) => {
            socket.emit('Answer',data)
        })
        peer.signal(offer)
    }

    ///handle answer coming from backend
    function SignalAnswer(answer){
        client.gotAnswer = true
        let peer = client.peer
        peer.signal(answer)
    }

    function CreateVideo(stream){
        let video = document.createElement('video')
        video.id = 'peerVideo'
        video.srcObject = stream
        video.setAttribute('class', 'embed-responsive-item')
        document.querySelector('#peerDiv').appendChild(video)
        video.play()
    }

    ///inform 3rd person that conversation is already active between 2
    function SessionActive(){
        document.write('Session Active come later')
    }

    function RemovePeer() {
        document.getElementById("peerVideo").remove();
        document.getElementById("muteText").remove();
        if (client.peer) {
            client.peer.destroy()
        }
    }

    socket.on('BackOffer', FrontAnswer)
    socket.on('BackAnswer', SignalAnswer)
    socket.on('SessionActive', SessionActive)
    socket.on('CreatePeer',MakePeer)
    socket.on('RemoveVideo',RemoveVideo)
})
.catch(error => document.write(error))