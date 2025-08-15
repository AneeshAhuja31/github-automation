document.addEventListener('DOMContentLoaded',async function () {
    const githubButton = document.querySelector('.github-button')
    if(githubButton){
        githubButton.addEventListener('click',async function() {
            githubButton.href = `http://localhost:8000/auth/login`
        })
    }
})