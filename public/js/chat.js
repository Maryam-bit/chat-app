
const socket = io()
// elements
const messageForm = document.querySelector("#message-form")
const messageFormInput = document.querySelector("input")
const messageFormButton = document.querySelector("button")
const sendLocationButton = document.querySelector("#send-location")
const messages = document.querySelector("#messages")

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML

// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})

const autoscroll = () => {
    const newMessage = messages.lastElementChild

    // height of the new message
    const newMessageStyles = getComputedStyle(newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = newMessage.offsetHeight + newMessageMargin

    // visible height 
    const visibleHeight = messages.offsetHeight

    // height of messages container
    const containerHeight = messages.scrollHeight

    // how far have i scrolled?
    const scrollOffset = messages.scrollTop + visibleHeight
    
    if(containerHeight - newMessageHeight <= scrollOffset) {
        messages.scrollTop = messages.scrollHeight
    }
}

// server (emit) -> client (receive) --acknowledgement --> server
// client (emit) -> server (receive) --acknowledgement --> client


socket.on("message", (message) => {
    console.log(message)
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("locationMessage", (message) => {
    console.log(message)
    const html = Mustache.render(locationMessageTemplate, {
        username: message.username,
        url: message.url,
        createdAt: moment(message.createdAt).format("h:mm a")
    })
    messages.insertAdjacentHTML("beforeend", html)
    autoscroll()
})

socket.on("roomData", ({room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    document.querySelector("#sidebar").innerHTML = html

})
messageForm.addEventListener("submit", (e) => {
    e.preventDefault();

    messageFormButton.setAttribute("disabled", true)
    // const message = document.querySelector("input").value
    const message = e.target.elements.message.value

    socket.emit("sendMessage", message, (error) => {
        messageFormButton.removeAttribute("disabled")
        messageFormInput.value = ""
        messageFormInput.focus()
        if(error) {
            return console.log(error)
        }
        console.log("Message delivered!")
    })
})


sendLocationButton.addEventListener("click", () => {
    if(!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser")
    }
    sendLocationButton.setAttribute("disabled", true)
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit("sendLocation", {latitude: position.coords.latitude, longitude: position.coords.longitude}, (message) => {
            console.log(message)
            sendLocationButton.removeAttribute("disabled")
        })
    }) 
})

socket.emit("join", { username, room }, (error) => {
    if(error) {
        alert(error)
        location.href='/'
    }
})