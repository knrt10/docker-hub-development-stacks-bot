module.exports = {
  createOwnerList(owners) {
    let list = ''
    for (i = 0; i < owners.length; i++) {
      list += `- **${owners[i]}**\n`
    }
    return list
  }
}
