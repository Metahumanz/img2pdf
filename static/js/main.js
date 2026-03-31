document.addEventListener('DOMContentLoaded', () => {
    // Heartbeat to keep backend alive. If page is closed, heartbeat stops and server shuts down.
    setInterval(() => {
        fetch('/api/heartbeat', { method: 'POST' }).catch(() => {});
    }, 2000);

    // DOM Elements
    const dropzone = document.getElementById('dropzone');
    const fileInput = document.getElementById('file-input');
    const imageList = document.getElementById('image-list');
    const previewSection = document.getElementById('preview-section');
    const fileCount = document.getElementById('file-count');
    const clearAllBtn = document.getElementById('clear-all');
    const generateBtn = document.getElementById('generate-btn');
    const themeToggle = document.getElementById('theme-toggle');
    const sunIcon = document.querySelector('.sun-icon');
    const moonIcon = document.querySelector('.moon-icon');
    const loadingOverlay = document.getElementById('loading');
    const toast = document.getElementById('toast');

    // State
    // Format: { id: string, file: File, url: string }
    let filesData = [];

    // Initialize Theme
    const initTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        }
    };
    initTheme();

    // Theme Toggle Handler
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'light' ? 'dark' : 'light';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        if (newTheme === 'dark') {
            sunIcon.style.display = 'none';
            moonIcon.style.display = 'block';
        } else {
            sunIcon.style.display = 'block';
            moonIcon.style.display = 'none';
        }
    });

    // Toast Notification
    let toastTimeout;
    const showToast = (message, type = 'success') => {
        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');
        
        clearTimeout(toastTimeout);
        toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    };

    // File Selection Handlers
    dropzone.addEventListener('click', () => fileInput.click());

    dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('dragover');
    });

    dropzone.addEventListener('dragleave', () => {
        dropzone.classList.remove('dragover');
    });

    dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleFiles(e.dataTransfer.files);
        }
    });

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleFiles(e.target.files);
        }
        // Reset input to allow selecting same files again
        fileInput.value = '';
    });

    // Handle New Files
    const handleFiles = (files) => {
        const validExtensions = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/tiff'];
        let added = 0;

        Array.from(files).forEach(file => {
            if (validExtensions.includes(file.type)) {
                // Generate a unique ID for sorting
                const id = Math.random().toString(36).substr(2, 9);
                const url = URL.createObjectURL(file);
                filesData.push({ id, file, url });
                added++;
            }
        });

        if (added > 0) {
            updateUI();
            if (added < files.length) {
                showToast(`已添加 ${added} 张图片，跳过了 ${files.length - added} 个非图片文件`, 'success');
            } else {
                showToast(`成功添加 ${added} 张图片`);
            }
        } else {
            showToast('未检测到支持的图片文件', 'error');
        }
    };

    // Update UI based on state
    const updateUI = () => {
        // Update count
        fileCount.textContent = filesData.length;
        
        // Show/hide sections
        if (filesData.length > 0) {
            previewSection.style.display = 'block';
            generateBtn.disabled = false;
        } else {
            previewSection.style.display = 'none';
            generateBtn.disabled = true;
        }

        renderList();
    };

    // Render Image List
    const renderList = () => {
        imageList.innerHTML = '';
        
        filesData.forEach((item, index) => {
            const li = document.createElement('li');
            li.className = 'image-item';
            li.draggable = true;
            li.dataset.id = item.id;
            li.dataset.index = index;
            
            li.innerHTML = `
                <span class="index-badge">${index + 1}</span>
                <img src="${item.url}" alt="${item.file.name}" class="image-thumb">
                <div class="item-overlay">${item.file.name}</div>
                <button class="remove-btn" data-id="${item.id}" aria-label="Remove image">&times;</button>
            `;
            
            // Setup Drag & Drop for sorting
            setupDragAndDrop(li);
            
            // Remove button handler
            const removeBtn = li.querySelector('.remove-btn');
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                removeFile(item.id);
            });
            
            imageList.appendChild(li);
        });
    };

    // Remove File
    const removeFile = (id) => {
        const index = filesData.findIndex(item => item.id === id);
        if (index !== -1) {
            URL.revokeObjectURL(filesData[index].url);
            filesData.splice(index, 1);
            updateUI();
        }
    };

    // Clear All
    clearAllBtn.addEventListener('click', () => {
        filesData.forEach(item => URL.revokeObjectURL(item.url));
        filesData = [];
        updateUI();
    });

    // Drag and Drop Sorting Logic
    let draggedItem = null;

    const setupDragAndDrop = (element) => {
        element.addEventListener('dragstart', function(e) {
            draggedItem = this;
            setTimeout(() => this.classList.add('dragging'), 0);
            e.dataTransfer.effectAllowed = 'move';
            // Need to set data for Firefox
            e.dataTransfer.setData('text/plain', this.dataset.index);
        });

        element.addEventListener('dragend', function() {
            this.classList.remove('dragging');
            draggedItem = null;
            
            // Rebuild filesData array based on new DOM order
            reorderFilesData();
        });

        element.addEventListener('dragover', function(e) {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            
            if (this === draggedItem) return;
            
            const bounding = this.getBoundingClientRect();
            const offset = bounding.y + (bounding.height / 2);
            
            if (e.clientY - offset > 0) {
                this.parentNode.insertBefore(draggedItem, this.nextSibling);
            } else {
                this.parentNode.insertBefore(draggedItem, this);
            }
        });
    };

    const reorderFilesData = () => {
        const newOrderIds = Array.from(imageList.children).map(li => li.dataset.id);
        const newFilesData = [];
        
        newOrderIds.forEach(id => {
            const item = filesData.find(f => f.id === id);
            if (item) newFilesData.push(item);
        });
        
        filesData = newFilesData;
        
        // Update badges without full rerender to prevent flicker
        Array.from(imageList.children).forEach((li, index) => {
            li.querySelector('.index-badge').textContent = index + 1;
            li.dataset.index = index;
        });
    };

    // Generate PDF API Call
    generateBtn.addEventListener('click', async () => {
        if (filesData.length === 0) return;
        
        loadingOverlay.classList.add('active');
        
        const formData = new FormData();
        filesData.forEach(item => {
            formData.append('files', item.file);
        });

        try {
            const response = await fetch('/api/convert', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Server Error');
            }

            // Handle the resulting PDF blob
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.style.display = 'none';
            a.href = downloadUrl;
            a.download = 'combined.pdf';
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(downloadUrl);
            a.remove();
            
            showToast('PDF 生成成功并已开始下载！');
        } catch (error) {
            console.error('Error generating PDF:', error);
            showToast('生成 PDF 时出错，请稍后重试', 'error');
        } finally {
            loadingOverlay.classList.remove('active');
        }
    });

    // Prevent default behaviors for the whole window to avoid unintended file openings
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        window.addEventListener(eventName, function(e) {
            e.preventDefault();
        }, false);
    });
});
