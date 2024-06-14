async function fetchMetaTags() {
    const urlsInput = document.getElementById('urlsInput');
    const urls = urlsInput.value.trim().split('\n').map(url => url.trim()).filter(url => url);

    if (urls.length === 0) {
        alert('Please enter at least one valid URL.');
        return;
    }

    try {
        const results = await Promise.all(urls.map(async url => {
            try {
                const response = await fetch(`http://localhost:3000/proxy?url=${encodeURIComponent(url)}`);
                const htmlContent = await response.text();
                const doc = new DOMParser().parseFromString(htmlContent, 'text/html');
                const metaTags = Array.from(doc.querySelectorAll('meta')).map(meta => ({
                    name: meta.getAttribute('name') || meta.getAttribute('property') || meta.getAttribute('itemprop') || 'N/A',
                    content: meta.getAttribute('content') || 'N/A'
                }));
                return { url, metaTags };
            } catch (error) {
                console.error(`Error fetching or parsing ${url}:`, error);
                return { url, error: 'Error fetching or parsing the page.' };
            }
        }));

        displayResults(results);
    } catch (error) {
        console.error('Error fetching URLs:', error);
        alert('Error fetching URLs. Please try again.');
    }
}

function displayResults(results) {
    const resultDiv = document.getElementById('result');
    resultDiv.innerHTML = '';

    results.forEach(result => {
        const urlHeading = document.createElement('h3');
        urlHeading.textContent = result.url;
        resultDiv.appendChild(urlHeading);

        if (result.error) {
            const errorPara = document.createElement('p');
            errorPara.textContent = result.error;
            resultDiv.appendChild(errorPara);
        } else {
            const metaList = document.createElement('ul');
            result.metaTags.forEach(meta => {
                const metaItem = document.createElement('li');
                metaItem.textContent = `${meta.name}: ${meta.content}`;
                metaList.appendChild(metaItem);
            });
            resultDiv.appendChild(metaList);
        }

        resultDiv.innerHTML += '<hr>';
    });

    // Enable download button if results are available
    const downloadButton = document.getElementById('downloadButton');
    if (results.length > 0) {
        downloadButton.style.display = 'block';
        downloadButton.onclick = function() {
            downloadMetaTags(results);
        };
    } else {
        downloadButton.style.display = 'none';
    }
}

function downloadMetaTags(results) {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(results.flatMap(result => {
        return result.metaTags.map(meta => ({
            'URL': result.url,
            'Meta Name': meta.name,
            'Meta Content': meta.content
        }));
    }));
    XLSX.utils.book_append_sheet(wb, ws, 'Meta Tags');
    const filePath = 'meta_tags.xlsx';
    XLSX.writeFile(wb, filePath);

    const downloadButton = document.getElementById('downloadButton');
    downloadButton.href = filePath;
}

