import Search from "./modules/search";
if(document.querySelector(".header-search-icon")) {new Search()}
import RegistrationForm from "./modules/registrationForm";

if(document.querySelector("#registration-form")) {
    new RegistrationForm()
}
import Chat from "./modules/chat";

if(document.querySelector("#chat-wrapper")) {
    //# is something how you can select an element based on its id
    // whereas . is something you can select an element based on its class
    new Chat()
}
