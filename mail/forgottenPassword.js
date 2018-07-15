module.exports = {
  subject: () => {
    return `Get a new password`;
  },
  message: (newPassword) => {
    let newPasswrd = newPassword;
    return `<b>You've been disturb, here is a quick reminder :</b><br><br>
    your new password: ${newPassword}`;
}
}//end module exports
