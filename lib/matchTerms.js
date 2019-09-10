module.exports = {
  matchTerms(terms, text) {
    const wordBoundaryTerms = terms.map((str) => {
      return str.replace(/^(.*\w+.*)$/i, '(?<=^|\\W)$1(?=\\W|$)')
    })
    
    const matches = text.match(new RegExp(`(${wordBoundaryTerms.join('|')})`, 'i'))
    return matches ? matches[1] : null
  }
}
