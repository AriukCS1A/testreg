function getUnsupportedMessage() {
    let ret = document.createElement("div");
    let idealBrowser = "a recent web browser";
    if (navigator.userAgent.match(/Android/i)) {
        idealBrowser = "Chrome for Android";
        window.location.href =
            "googlechrome://navigate?url=" + encodeURI(window.location.href);
        setTimeout(() => {
            window.location.href =
                "samsunginternet://open?url=" + encodeURI(window.location.href);
        }, 2000);
    }
    else if (navigator.userAgent.match(/iPhone|iPod|iPad/i)) {
        idealBrowser = "Safari";
        ret.classList.add("zee-launcher-browser-safari");
    }
    ret.classList.add("zee-launcher-unsupported");
    ret.innerHTML = `
            <style>.zee-launcher-unsupported {
               display: flex;
               flex-direction: column;
               height: 100%;
               justify-content: center;
               position: absolute;
               width: 100%;
               height: 100%;
               top: 0;
               left: 0;
               align-items: center;
               }
               .zee-launcher-browser-logo {
               background-image: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg version='1.1' viewBox='0 0 210 211' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg transform='translate(-82 -146)' fill-rule='nonzero' stroke='%23ffffff' stroke-width='2'%3E%3Cg transform='translate(83 146.5)'%3E%3Cpath d='m55.146 88.785l-32.039-49.472c19.962-24.947 49.904-38.684 80.517-38.81 17.739-0.12642 35.855 4.4246 52.336 13.99 18.2 10.619 32.039 25.874 40.846 43.404l-86.095-4.5511c-24.365-1.4327-47.556 12.347-55.565 35.439zm13.797 16.224c0 19.468 15.684 35.229 35.059 35.229 19.374 0 35.059-15.76 35.059-35.229 0-19.468-15.684-35.229-35.059-35.229-19.374 0-35.059 15.718-35.059 35.229zm132.06-37.588l-58.585 3.034c15.894 18.668 16.145 45.595 2.7678 66.243l-47.01 72.648c19.5 1.0535 39.588-3.2447 57.788-13.864 45.039-26.126 63.282-80.908 45.039-128.06zm-144.93 57.647l-39.126-77.326c-10.694 16.434-16.942 36.156-16.942 57.267 0 52.253 38.078 95.53 87.856 103.2l26.713-52.59c-24.155 4.5511-47.472-8.765-58.501-30.551z'/%3E%3C/g%3E%3C/g%3E%3C/g%3E%3C/svg%3E%0A");
               width: 211px;
               height: 211px;
               margin-bottom: 25%;
               margin-top: -60px;
               background-repeat: no-repeat;
               }
               .zee-launcher-browser-safari .zee-launcher-browser-logo {
               background-image: url("data:image/svg+xml,%3C%3Fxml version='1.0' encoding='UTF-8'%3F%3E%3Csvg version='1.1' viewBox='0 0 211 211' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg transform='translate(-82 -146)' fill-rule='nonzero' stroke='%23ffffff' stroke-width='2'%3E%3Cpath d='m180 251.86c0-4.0385 2.9377-7.855 7.2552-7.855 3.9614 0 7.7448 2.8402 7.7448 7.145 0 4.0385-2.8487 7.855-7.1662 7.855-4.0059 0-7.8338-2.9734-7.8338-7.145zm112-0.35503c0 57.728-46.772 104.5-104.5 104.5s-104.5-46.772-104.5-104.5 46.772-104.5 104.5-104.5 104.5 46.772 104.5 104.5zm-12-1c0-51.649-41.851-93.5-93.5-93.5s-93.5 41.851-93.5 93.5 41.851 93.5 93.5 93.5 93.5-41.851 93.5-93.5zm-30.624 40.983c0 1.5095 5.4495 4.2768 6.8328 5.1154-11.486 17.401-29.26 29.938-49.423 34.928l-1.8444-7.757c-0.12576-1.0482-0.79646-1.174-1.7606-1.174-0.79646 0-1.2576 1.174-1.1737 1.7611l1.8444 7.8828c-5.5753 1.174-11.234 1.7611-16.935 1.7611-15.217 0-30.182-4.2768-43.177-12.202 0.71263-1.174 5.1141-7.5474 5.1141-8.4698 0-0.79666-0.71263-1.5095-1.5091-1.5095-1.6348 0-5.1141 6.9603-6.1621 8.344-17.522-11.615-30.182-29.602-35.044-50.148l8.0066-1.761c0.92222-0.25158 1.1737-0.92246 1.1737-1.7611 0-0.79667-1.1737-1.2579-1.8444-1.174l-7.8389 1.803c-1.048-5.3251-1.6348-10.692-1.6348-16.143 0-15.556 4.4015-30.86 12.66-43.984 1.1737 0.71281 6.749 4.5284 7.6712 4.5284 0.79646 0 1.5091-0.58702 1.5091-1.3837 0-1.6353-6.1621-4.7381-7.5455-5.7024 11.821-17.275 29.805-29.728 50.219-34.34l1.7606 7.757c0.25152 0.92246 0.92222 1.174 1.7606 1.174 0.83838 0 1.2576-1.174 1.1737-1.8449l-1.7606-7.6732c5.1141-0.92246 10.312-1.5095 15.552-1.5095 15.552 0 30.727 4.4026 43.973 12.663-0.79646 1.174-4.5273 6.6249-4.5273 7.5474 0 0.79667 0.58687 1.5095 1.3833 1.5095 1.6348 0 4.7369-6.0379 5.5753-7.4216 17.187 11.615 29.469 29.351 34.248 49.561l-6.4975 1.3837c-1.048 0.25158-1.1737 0.92246-1.1737 1.8449 0 0.79667 1.1737 1.2579 1.7606 1.174l6.6232-1.5095c1.048 5.3251 1.6348 10.776 1.6348 16.227 0 15.221-4.1919 30.189-12.073 43.062-1.1737-0.58702-6.0364-4.0672-6.9586-4.0672-0.8803 0-1.5929 0.71281-1.5929 1.5095zm-14.876-98.483c-5.2178 4.88-53.863 49.48-55.228 51.8l-38.772 64.2c5.0974-4.76 53.863-49.6 55.108-51.72l38.892-64.28z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
               }
               .zee-launcher-unsupported-message {
               text-align: center;
               width: 250px;
               font-family: sans-serif;
               color: #ffffff;
               }
               .zee-launcher-unsupported-message-copy {
               border: 1px solid #ffffff;
               border-radius: 5px;
               margin-top: 10px;
               }
               #zee-launcher-unsupported-message-input {
               border: none;
               padding: 10px;
               border-radius: 0px;
               border-right: 1px solid #344B60;
               height: 40px;
               color: #ffffff;
               background-color: black;
               box-sizing: border-box;
               width: calc(100% - 65px);
               margin-left: 5px;
               }
               #zee-launcher-unsupported-message-button {
               background: none;
               border: none;
               outline: none;
               text-transform: uppercase;
               color: #ffffff;
               height: 40px;
               display: inline-block;
               width: 59px;
               }
               .zee-launcher-unsupported-message-before-copy {
               height: 100px;
               display: flex;
               flex-direction: column;
               justify-content: center;
               margin-top: 20px;
               }
               .zee-launcher-unsupported-message-copied .zee-launcher-unsupported-message-before-copy {
               display: none;
               }
               .zee-launcher-unsupported-message-after-copy {
               display: none;
               }
               .zee-launcher-unsupported-message-copied .zee-launcher-unsupported-message-after-copy {
               height: 100px;
               display: flex;
               flex-direction: column;
               justify-content: center;
               margin-top: 20px;
               }
            </style>
            <div class="zee-launcher-browser-logo"></div>
            <div class="zee-launcher-unsupported-message">Open with ${idealBrowser} to access this content.</div>
            <div class="zee-launcher-unsupported-message-before-copy">
               <div class="zee-launcher-unsupported-message ">Tap below to copy the address for easy pasting into ${idealBrowser}.</div>
               <div class="zee-launcher-unsupported-message-copy"><input id="zee-launcher-unsupported-message-input" type="text/"><button id="zee-launcher-unsupported-message-button">Copy</button></div>
            </div>
            <div class="zee-launcher-unsupported-message zee-launcher-unsupported-message-after-copy">COPIED! Now paste into ${idealBrowser}'s address bar to experience the content.</div>
    `;
    let inpElm = ret.querySelector("#zee-launcher-unsupported-message-input") || document.createElement("input");
    inpElm.value = window.location.href;
    let btnElm = ret.querySelector("#zee-launcher-unsupported-message-button") || document.createElement("button");
    let onCopyPressed = () => {
        if (navigator.userAgent.match(/iPhone|iPod|iPad/i)) {
            let r = document.createRange();
            r.selectNodeContents(inpElm);
            let sel = window.getSelection();
            if (!sel)
                return;
            sel.removeAllRanges();
            sel.addRange(r);
            inpElm.setSelectionRange(0, 999999999);
        }
        else {
            inpElm.select();
        }
        document.execCommand("copy");
        inpElm.blur();
        ret.classList.toggle("zee-launcher-unsupported-message-copied", true);
    };
    btnElm.addEventListener("click", onCopyPressed);
    inpElm.addEventListener("click", onCopyPressed);
    return ret;
}
const incompatibleUI = () => {
    const zapparCompatibility = document.createElement("div");
    zapparCompatibility.append(getUnsupportedMessage());
    Object.assign(zapparCompatibility.style, {
        position: "fixed",
        width: "100%",
        height: "100%",
        top: "0px",
        left: "0px",
        zIndex: 1001,
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        fontFamily: "sans-serif",
        color: "white",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
    });
    zapparCompatibility.classList.add("zee_launcher_compatibility");
    document.body.append(zapparCompatibility);
};
function isSupportedBrowser() {
    if (typeof Promise !== "function")
        return false;
    if (typeof WebAssembly !== "object")
        return false;
    if (!navigator.mediaDevices ||
        !navigator.mediaDevices.enumerateDevices ||
        !navigator.mediaDevices.getUserMedia)
        return false;
    return true;
}
export default {
    incompatible: () => !isSupportedBrowser(),
    incompatible_ui: incompatibleUI,
};
