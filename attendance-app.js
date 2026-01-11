// Project TimeTag - Attendance Management System
class AttendanceManager {
    constructor() {
        this.engineers = [];
        this.attendanceData = {};
        this.uploadedFiles = [];
        this.currentWeekStart = null;
        this.currentWeekEnd = null;

        // Schedule management - simplified format
        this.engineerSchedules = [];
        this.uploadedScheduleFiles = [];
        this.currentEditScheduleIndex = null;

        this.init();
    }

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setDefaultWeek();
        this.renderTable();
        this.updateSummaryStats();
    }

    loadData() {
        // Load data from localStorage if available
        const savedEngineers = localStorage.getItem('timetagEngineers');
        const savedAttendance = localStorage.getItem('timetagAttendance');
        const savedFiles = localStorage.getItem('timetagFiles');
        const savedEngineerSchedules = localStorage.getItem('timetagEngineerSchedules');
        const savedScheduleFiles = localStorage.getItem('timetagScheduleFiles');

        if (savedEngineers) {
            this.engineers = JSON.parse(savedEngineers);
        } else {
            // Start with empty engineers array - data will come from uploaded files
            this.engineers = [];
        }

        if (savedAttendance) {
            this.attendanceData = JSON.parse(savedAttendance);
        } else {
            // Start with empty attendance data - data will come from uploaded files
            this.attendanceData = {};
        }

        if (savedFiles) {
            this.uploadedFiles = JSON.parse(savedFiles);
        }

        if (savedEngineerSchedules) {
            this.engineerSchedules = JSON.parse(savedEngineerSchedules);
        } else {
            this.engineerSchedules = [];
        }

        if (savedScheduleFiles) {
            this.uploadedScheduleFiles = JSON.parse(savedScheduleFiles);
        }

        this.updateFileList();
    }

    saveData() {
        localStorage.setItem('timetagEngineers', JSON.stringify(this.engineers));
        localStorage.setItem('timetagAttendance', JSON.stringify(this.attendanceData));
        localStorage.setItem('timetagFiles', JSON.stringify(this.uploadedFiles));
        localStorage.setItem('timetagEngineerSchedules', JSON.stringify(this.engineerSchedules));
        localStorage.setItem('timetagScheduleFiles', JSON.stringify(this.uploadedScheduleFiles));
    }


    setupEventListeners() {
        // File input change
        document.getElementById('fileInput').addEventListener('change', (e) => {
            this.handleFileSelection(e.target.files);
        });

        // Drag and drop
        const uploadArea = document.querySelector('.upload-area');
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            this.handleFileSelection(e.dataTransfer.files);
        });

        // Forms
        document.getElementById('addEngineerForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addEngineer();
        });

        document.getElementById('editStatusForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateStatus();
        });

        // Status dropdown change
        document.getElementById('editStatus').addEventListener('change', (e) => {
            const lateGroup = document.getElementById('lateMinutesGroup');
            if (e.target.value === 'LATE') {
                lateGroup.style.display = 'block';
            } else {
                lateGroup.style.display = 'none';
            }
        });


        // Schedule forms
        document.getElementById('addScheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addSchedule();
        });

        document.getElementById('addBulkScheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.addBulkSchedules();
        });

        document.getElementById('editScheduleForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.updateSchedule();
        });

    }

    setDefaultWeek() {
        // Set default to November 17-23, 2025 to match sample data
        // Create dates in local time to avoid timezone offset issues
        const weekStart = new Date(2025, 10, 17); // Month is 0-indexed (10 = November)
        const weekEnd = new Date(2025, 10, 23);

        this.currentWeekStart = weekStart;
        this.currentWeekEnd = weekEnd;

        document.getElementById('startDate').value = this.formatDateInput(weekStart);
        document.getElementById('endDate').value = this.formatDateInput(weekEnd);

        this.updateWeekDisplay();
    }

    getWeekStart(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday
        return new Date(d.setDate(diff));
    }

    updateDateRange() {
        // Parse date string as local date to avoid timezone issues
        const startDateStr = document.getElementById('startDate').value;
        const endDateStr = document.getElementById('endDate').value;

        const startParts = startDateStr.split('-');
        const endParts = endDateStr.split('-');

        const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
        const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

        this.currentWeekStart = startDate;
        this.currentWeekEnd = endDate;

        this.updateWeekDisplay();
        this.renderTable();
        this.updateSummaryStats();
    }

    updateWeekDisplay() {
        const start = this.formatDateForExport(this.currentWeekStart);
        const end = this.formatDateForExport(this.currentWeekEnd);
        document.getElementById('weekDisplay').textContent = `Attendance Dashboard - ${start} to ${end}`;
    }

    formatDateKey(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateInput(date) {
        return date.toISOString().split('T')[0];
    }

    formatDateDisplay(date) {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric'
        });
    }

    formatDateForExport(date) {
        // Format as MM/DD/YYYY to match the input format
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const day = date.getDate().toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${month}/${day}/${year}`;
    }

    formatDateHeader(date) {
        // Just return the date in MM/DD/YYYY format
        return this.formatDateForExport(date);
    }

    handleFileSelection(files) {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            // Accept based on file extension (more reliable than MIME type)
            const fileName = file.name.toLowerCase();
            return fileName.endsWith('.csv') ||
                   fileName.endsWith('.json') ||
                   fileName.endsWith('.txt') ||
                   fileName.endsWith('.xlsx') ||
                   fileName.endsWith('.xls');
        });

        if (validFiles.length === 0) {
            alert('Please select valid files (.csv, .json, .txt, .xls, or .xlsx)');
            return;
        }

        // Add files to the list
        validFiles.forEach(file => {
            if (!this.uploadedFiles.find(f => f.name === file.name)) {
                this.uploadedFiles.push({
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    uploadTime: new Date().toISOString(),
                    file: file
                });
            }
        });

        this.updateFileList();
        this.saveData();
    }

    updateFileList() {
        const fileList = document.getElementById('fileList');

        if (this.uploadedFiles.length === 0) {
            fileList.innerHTML = '<p style="color: #666; font-style: italic;">No files uploaded yet</p>';
            return;
        }

        fileList.innerHTML = this.uploadedFiles.map(file => `
            <div class="file-item">
                <span>📄 ${file.name} (${this.formatFileSize(file.size)})</span>
                <button class="delete-btn" onclick="attendanceApp.removeFile('${file.name}')">×</button>
            </div>
        `).join('');
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    removeFile(fileName) {
        this.uploadedFiles = this.uploadedFiles.filter(file => file.name !== fileName);
        this.updateFileList();
        this.saveData();
    }

    async processFiles() {
        if (this.uploadedFiles.length === 0) {
            // No files uploaded - obvious from UI
            return;
        }

        if (this.engineerSchedules.length === 0) {
            alert('⚠️ No engineer schedules found! Please upload schedule file first before processing attendance data.');
            return;
        }

        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const processBtn = document.getElementById('processBtn');

        progressBar.style.display = 'block';
        processBtn.disabled = true;

        let processed = 0;
        for (const fileInfo of this.uploadedFiles) {
            try {
                await this.parseFile(fileInfo.file);
                processed++;

                const progress = (processed / this.uploadedFiles.length) * 100;
                progressFill.style.width = progress + '%';

                // Simulate processing time
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (error) {
                console.error('Error processing file:', fileInfo.name, error);
            }
        }

        setTimeout(() => {
            progressBar.style.display = 'none';
            progressFill.style.width = '0%';
            processBtn.disabled = false;

            this.renderTable();
            this.updateSummaryStats();
            this.saveData();

            // Files processed successfully - no need for dialog
        }, 500);
    }

    async parseFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    let content = e.target.result;

                    // For ArrayBuffer (used for all files now), decode to text
                    if (content instanceof ArrayBuffer) {
                        // Try UTF-8 first
                        try {
                            const decoder = new TextDecoder('utf-8');
                            content = decoder.decode(content);
                        } catch (err) {
                            // Fallback to windows-1252 encoding
                            try {
                                const decoder = new TextDecoder('windows-1252');
                                content = decoder.decode(content);
                            } catch (err2) {
                                // Last resort - ISO-8859-1
                                const decoder = new TextDecoder('iso-8859-1');
                                content = decoder.decode(content);
                            }
                        }
                    }

                    if (file.name.endsWith('.json')) {
                        this.parseJSONData(content);
                    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
                        // Parse Excel file using SheetJS
                        if (typeof XLSX === 'undefined') {
                            alert('Excel library not loaded. Please refresh the page and try again.');
                            reject(new Error('XLSX library not loaded'));
                            return;
                        }

                        try {
                            const workbook = XLSX.read(e.target.result, { type: 'array' });
                            const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                            const csvContent = XLSX.utils.sheet_to_csv(firstSheet);

                            if (!csvContent || csvContent.trim() === '') {
                                alert('Excel file appears to be empty or unreadable.');
                                reject(new Error('Empty Excel file'));
                                return;
                            }

                            this.parseCSVData(csvContent);
                        } catch (excelError) {
                            console.error('Excel parsing error:', excelError);
                            alert('Error reading Excel file: ' + excelError.message);
                            reject(excelError);
                            return;
                        }
                    } else if (file.name.endsWith('.csv')) {
                        this.parseCSVData(content);
                    } else {
                        this.parseTextData(content);
                    }

                    resolve();
                } catch (error) {
                    console.error('Error parsing file:', error);
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);

            // Always use ArrayBuffer - more reliable for different file sensitivities
            reader.readAsArrayBuffer(file);
        });
    }

    parseJSONData(content) {
        // Remove BOM if present
        let cleanContent = content;
        if (content.charCodeAt(0) === 0xFEFF) {
            cleanContent = content.substring(1);
        }
        cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/^\xEF\xBB\xBF/, '');

        const data = JSON.parse(cleanContent);

        // Expected format: { "engineerName": { "date": "status" } }
        Object.keys(data).forEach(engineerName => {
            let engineer = this.engineers.find(e => this.nameTokensMatch(e.name, engineerName));

            if (!engineer) {
                // Add new engineer
                engineer = {
                    id: Date.now() + Math.random(),
                    name: this.normalizeName(engineerName),
                    icon: this.getRandomIcon()
                };
                this.engineers.push(engineer);
            }

            if (!this.attendanceData[engineer.id]) {
                this.attendanceData[engineer.id] = {};
            }

            Object.keys(data[engineerName]).forEach(date => {
                const status = data[engineerName][date];
                this.attendanceData[engineer.id][date] = status;
            });
        });
    }

    parseCSVData(content) {
        // Remove BOM (Byte Order Mark) if present - handles different encodings
        let cleanContent = content;
        if (content.charCodeAt(0) === 0xFEFF) {
            cleanContent = content.substring(1);
        }
        // Also remove any invisible characters at start
        cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/^\xEF\xBB\xBF/, '');

        const lines = cleanContent.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        // Check if this is the new format with login/logout times
        const hasLoginLogout = headers.some(h =>
            h.toLowerCase().includes('logged in') ||
            h.toLowerCase().includes('logged out') ||
            h.toLowerCase().includes('agent') ||
            h.toLowerCase().includes('duration')
        );

        if (hasLoginLogout) {
            this.parseLoginLogoutCSV(lines, headers);
        } else {
            // Original format: Name, Date, Status
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim());

                if (values.length >= 3) {
                    const engineerName = values[0];
                    const date = values[1];
                    const status = values[2];

                    let engineer = this.engineers.find(e => this.nameTokensMatch(e.name, engineerName));

                    if (!engineer) {
                        engineer = {
                            id: Date.now() + Math.random() + i,
                            name: this.normalizeName(engineerName),
                            icon: this.getRandomIcon()
                        };
                        this.engineers.push(engineer);
                    }

                    if (!this.attendanceData[engineer.id]) {
                        this.attendanceData[engineer.id] = {};
                    }

                    this.attendanceData[engineer.id][date] = status.toUpperCase();
                }
            }
        }
    }

    parseLoginLogoutCSV(lines, headers) {
        // Expected format: Date, Agent, First Logged in Time Local, Last Logged out Time Local, Total Duration (hrs)
        const dateIndex = headers.findIndex(h => h.toLowerCase().includes('date'));
        const agentIndex = headers.findIndex(h => h.toLowerCase().includes('agent'));
        const loginIndex = headers.findIndex(h => h.toLowerCase().includes('logged in'));
        const logoutIndex = headers.findIndex(h => h.toLowerCase().includes('logged out'));
        const durationIndex = headers.findIndex(h => h.toLowerCase().includes('duration'));

        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);

            if (values.length >= Math.max(dateIndex, agentIndex) + 1) {
                const dateStr = values[dateIndex] || '';
                let engineerName = values[agentIndex] || '';

                // Fix special characters IMMEDIATELY before any processing
                if (engineerName && engineerName.trim()) {
                    // Skip if this looks like a date or header row
                    if (engineerName.toLowerCase().includes('date') ||
                        engineerName.toLowerCase().includes('agent') ||
                        engineerName.toLowerCase().includes('november') ||
                        engineerName.toLowerCase().includes('december') ||
                        engineerName.toLowerCase().includes('january') ||
                        /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(engineerName.trim())) {
                        continue; // Skip this row
                    }
                    engineerName = this.normalizeName(engineerName);
                }

                if (dateStr && engineerName) {
                    // Convert date to standard format (YYYY-MM-DD)
                    const date = this.parseDate(dateStr);

                    let engineer = this.engineers.find(e => e.name === engineerName);

                    if (!engineer) {
                        engineer = {
                            id: Date.now() + Math.random() + i,
                            name: engineerName, // engineerName is already normalized above
                            icon: this.getRandomIcon()
                        };
                        this.engineers.push(engineer);
                    }

                    if (!this.attendanceData[engineer.id]) {
                        this.attendanceData[engineer.id] = {};
                    }

                    // CRITICAL RULE: Engineer schedule MUST exist before any calculations
                    const engineerSchedule = this.engineerSchedules.find(schedule =>
                        this.nameTokensMatch(schedule.engineer, engineerName)
                    );

                    let status = '';

                    // Only proceed with calculations if engineer schedule exists
                    if (engineerSchedule) {
                        if (loginIndex >= 0 && logoutIndex >= 0 && values[loginIndex] && values[logoutIndex]) {
                            const loginTime = values[loginIndex];
                            const logoutTime = values[logoutIndex];

                            const durationMinutes = this.calculateWorkDurationMinutes(loginTime, logoutTime);


                            if (durationMinutes >= 540) { // 9 hours = 540 minutes
                                // Check lateness only if worked ≥9 hours
                                const lateMinutes = this.calculateLateness(engineerName, loginTime, date);

                                if (lateMinutes > 0) {
                                    // Late but worked full hours - show late minutes
                                    status = lateMinutes.toString();
                                } else {
                                    // On time and worked full hours
                                    status = 'IN';
                                }
                            } else if (durationMinutes > 0) { // Worked less than 9 hours but more than 0
                                // Check lateness
                                const lateMinutes = this.calculateLateness(engineerName, loginTime, date);

                                if (lateMinutes > 0) {
                                    // Late - show late minutes
                                    status = lateMinutes.toString();
                                } else {
                                    // On time but didn't work full hours - show missing minutes
                                    const missingMinutes = Math.ceil(540 - durationMinutes);
                                    status = missingMinutes.toString();
                                }
                            } else {
                                // No work duration - blank
                                status = '';
                            }
                        }
                        // If we have duration from the CSV, use that instead
                        else if (durationIndex >= 0 && values[durationIndex]) {
                            const csvDurationHours = parseFloat(values[durationIndex]);
                            if (!isNaN(csvDurationHours)) {
                                const csvDurationMinutes = csvDurationHours * 60;

                                if (csvDurationMinutes >= 540) { // 9 hours = 540 minutes
                                    // Check lateness only if worked ≥9 hours
                                    const lateMinutes = this.calculateLateness(engineerName, values[loginIndex] || '', date);

                                    if (lateMinutes > 0) {
                                        status = lateMinutes.toString();
                                    } else {
                                        status = 'IN';
                                    }
                                } else if (csvDurationMinutes > 0) { // Worked less than 9 hours but more than 0
                                    // Check lateness
                                    const lateMinutes = this.calculateLateness(engineerName, values[loginIndex] || '', date);

                                    if (lateMinutes > 0) {
                                        // Late - show late minutes
                                        status = lateMinutes.toString();
                                    } else {
                                        // On time but didn't work full hours - show missing minutes
                                        const missingMinutes = Math.ceil(540 - csvDurationMinutes);
                                        status = missingMinutes.toString();
                                    }
                                } else {
                                    status = '';
                                }
                            }
                        }
                    } else {
                        // No schedule found - cannot calculate anything
                        status = '';
                    }


                    this.attendanceData[engineer.id][date] = status;

                    // Store additional data for future use
                    if (loginIndex >= 0 && values[loginIndex]) {
                        this.attendanceData[engineer.id][date + '_login'] = values[loginIndex];
                    }
                    if (logoutIndex >= 0 && values[logoutIndex]) {
                        this.attendanceData[engineer.id][date + '_logout'] = values[logoutIndex];
                    }
                    if (durationIndex >= 0 && values[durationIndex]) {
                        this.attendanceData[engineer.id][date + '_duration'] = values[durationIndex];
                    }
                }
            }
        }
    }

    calculateWorkDuration(loginTime, logoutTime) {
        try {
            // Parse login time
            const loginDate = new Date(loginTime);
            // Parse logout time
            const logoutDate = new Date(logoutTime);

            if (isNaN(loginDate.getTime()) || isNaN(logoutDate.getTime())) {
                return 0;
            }

            // Calculate difference in milliseconds
            const diffMs = logoutDate.getTime() - loginDate.getTime();

            // Convert to hours
            const diffHours = diffMs / (1000 * 60 * 60);

            return Math.max(0, diffHours);
        } catch (error) {
            console.error('Error calculating work duration:', error);
            return 0;
        }
    }

    parseTimeString(timeStr) {
        if (!timeStr) return null;

        // Handle format: "12 1 2025 8:50:13 PM" or "12/1/2025 8:50:13 PM"
        // Also handle format: "12 1 2025 20:50" (24-hour with spaces)
        const timeMatch = timeStr.match(/(\d{1,2})[\s\/]+(\d{1,2})[\s\/]+(\d{4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);

        if (timeMatch) {
            const [, month, day, year, hours, minutes, seconds, ampm] = timeMatch;

            let hour = parseInt(hours);

            // Handle AM/PM if present
            if (ampm) {
                const period = ampm.toUpperCase();
                if (period === 'PM' && hour !== 12) {
                    hour += 12;
                } else if (period === 'AM' && hour === 12) {
                    hour = 0;
                }
            }

            return new Date(
                parseInt(year),
                parseInt(month) - 1,
                parseInt(day),
                hour,
                parseInt(minutes),
                seconds ? parseInt(seconds) : 0
            );
        }

        // Fallback to standard Date parsing
        const date = new Date(timeStr);
        return isNaN(date.getTime()) ? null : date;
    }

    calculateWorkDurationMinutes(loginTime, logoutTime) {
        try {
            // Parse login time
            const loginDate = this.parseTimeString(loginTime);
            // Parse logout time
            const logoutDate = this.parseTimeString(logoutTime);

            if (!loginDate || !logoutDate || isNaN(loginDate.getTime()) || isNaN(logoutDate.getTime())) {
                return 0;
            }

            // Calculate difference in milliseconds
            let diffMs = logoutDate.getTime() - loginDate.getTime();

            // Handle date boundary issues (when logout is "before" login due to date parsing)
            // This often happens with midnight shifts
            if (diffMs < 0) {
                // If difference is negative, logout is probably the next day
                // Add 24 hours (86400000 ms) to the logout time
                const nextDayLogout = new Date(logoutDate.getTime() + (24 * 60 * 60 * 1000));
                diffMs = nextDayLogout.getTime() - loginDate.getTime();
            }

            // Convert to minutes
            const diffMinutes = diffMs / (1000 * 60);

            // Sanity check: if duration is more than 24 hours, something is wrong
            if (diffMinutes > 1440) { // 1440 = 24 hours in minutes
                return 0; // Return 0 to avoid crazy values
            }

            return Math.max(0, Math.floor(diffMinutes));
        } catch (error) {
            console.error('Error calculating work duration in minutes:', error);
            return 0;
        }
    }

    calculateLateness(engineerName, actualLoginTime, date) {
        try {
            // Find engineer's scheduled shift start time
            const engineerSchedule = this.engineerSchedules.find(schedule =>
                this.nameTokensMatch(schedule.engineer, engineerName)
            );

            if (!engineerSchedule || !engineerSchedule.shiftStart) {
                // No schedule found, can't determine lateness
                return 0;
            }

            // Parse actual login time first
            const actualLoginDate = this.parseTimeString(actualLoginTime);
            if (!actualLoginDate || isNaN(actualLoginDate.getTime())) {
                return 0;
            }

            // Create scheduled time using the same date as the actual login
            const scheduledStartTime = this.parseScheduledTimeFromLogin(
                engineerSchedule.shiftStart,
                actualLoginDate
            );

            if (isNaN(scheduledStartTime.getTime())) {
                return 0;
            }

            // Calculate difference in milliseconds
            const diffMs = actualLoginDate.getTime() - scheduledStartTime.getTime();

            // Convert to minutes
            const diffMinutes = diffMs / (1000 * 60);

            // ONLY calculate lateness if logged in AFTER scheduled start time
            // If logged in early (negative diffMinutes), return 0 (not late)
            // If logged in late (positive diffMinutes), return late minutes
            if (diffMinutes > 0) {
                return Math.floor(diffMinutes); // Late by X minutes
            } else {
                return 0; // On time or early - no lateness
            }

        } catch (error) {
            console.error('Error calculating lateness:', error);
            return 0;
        }
    }

    parseScheduledTimeFromLogin(timeString, loginDate) {
        try {
            // Parse time string like "9:00 PM" or "12:00 AM"
            const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

            if (!timeParts) {
                throw new Error('Invalid time format');
            }

            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3].toLowerCase();

            // Convert to 24-hour format
            if (ampm === 'pm' && hours !== 12) {
                hours += 12;
            } else if (ampm === 'am' && hours === 12) {
                hours = 0;
            }

            // For midnight shifts (12:00 AM), need special date handling
            const loginHour = loginDate.getHours();
            let scheduledDate;

            if (hours === 0) {
                // This is a midnight shift (12:00 AM)
                if (loginHour >= 12) {
                    // Login is in afternoon/evening (12 PM to 11:59 PM)
                    // Midnight shift is at the start of the NEXT day
                    scheduledDate = new Date(
                        loginDate.getFullYear(),
                        loginDate.getMonth(),
                        loginDate.getDate() + 1, // Next day at midnight
                        0, // Midnight hour
                        minutes,
                        0,
                        0
                    );
                } else {
                    // Login is in early morning (12:00 AM to 11:59 AM)
                    // Midnight shift already started (same day)
                    scheduledDate = new Date(
                        loginDate.getFullYear(),
                        loginDate.getMonth(),
                        loginDate.getDate(), // Same day at midnight
                        0, // Midnight hour
                        minutes,
                        0,
                        0
                    );
                }
            } else {
                // Regular shift - use same date as login
                scheduledDate = new Date(
                    loginDate.getFullYear(),
                    loginDate.getMonth(),
                    loginDate.getDate(),
                    hours,
                    minutes,
                    0,
                    0
                );
            }

            return scheduledDate;

        } catch (error) {
            console.error('Error parsing scheduled time from login:', error);
            return new Date(NaN);
        }
    }

    parseScheduledTime(timeString, date) {
        try {
            // Parse time string like "9:00 PM" or "12:00 AM"
            const timeParts = timeString.match(/(\d{1,2}):(\d{2})\s*(AM|PM)/i);

            if (!timeParts) {
                throw new Error('Invalid time format');
            }

            let hours = parseInt(timeParts[1]);
            const minutes = parseInt(timeParts[2]);
            const ampm = timeParts[3].toLowerCase();

            // Convert to 24-hour format
            if (ampm === 'pm' && hours !== 12) {
                hours += 12;
            } else if (ampm === 'am' && hours === 12) {
                hours = 0;
            }

            // Get the actual login date to ensure we're using the right day
            const loginDate = new Date(date);

            // Create scheduled time on the same date as the login
            const scheduledDate = new Date(loginDate);
            scheduledDate.setHours(hours, minutes, 0, 0);

            return scheduledDate;

        } catch (error) {
            console.error('Error parsing scheduled time:', error);
            return new Date(NaN);
        }
    }

    parseCSVLine(line) {
        // Handle comma-separated, tab-separated, and multiple-space-separated values
        let result = [];

        if (line.includes('\t')) {
            // Tab-separated
            result = line.split('\t').map(item => item.trim());
        } else if (line.includes(',')) {
            // Comma-separated (with quote handling)
            let current = '';
            let inQuotes = false;

            for (let i = 0; i < line.length; i++) {
                const char = line[i];

                if (char === '"') {
                    inQuotes = !inQuotes;
                } else if (char === ',' && !inQuotes) {
                    result.push(current.trim());
                    current = '';
                } else {
                    current += char;
                }
            }
            result.push(current.trim());
        } else {
            // Multiple spaces (common when copying from formatted displays)
            result = line.split(/\s{2,}/).map(item => item.trim()).filter(item => item.length > 0);
        }

        return result;
    }

    parseDate(dateStr) {
        // Handle slash-separated dates
        const slashMatch = dateStr.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})/);
        if (slashMatch) {
            const [, first, second, year] = slashMatch;

            // Smart date detection: if first number > 12, it must be DD/MM/YYYY
            if (parseInt(first) > 12) {
                // Definitely DD/MM/YYYY (e.g., 25/12/2025)
                const day = first;
                const month = second;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            // If second number > 12, it must be MM/DD/YYYY
            else if (parseInt(second) > 12) {
                // Definitely MM/DD/YYYY (e.g., 12/25/2025)
                const month = first;
                const day = second;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
            // Ambiguous case - default to MM/DD/YYYY for US format
            else {
                const month = first;
                const day = second;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        // Handle space-separated dates like "1 12 2025" (D M YYYY) or "12 1 2025" (M D YYYY)
        const spaceMatch = dateStr.trim().match(/^(\d{1,2})\s+(\d{1,2})\s+(\d{4})$/);
        if (spaceMatch) {
            const [, first, second, year] = spaceMatch;

            // Smart detection for space-separated dates
            if (parseInt(first) > 12) {
                // First number > 12, must be D M Y
                const day = first;
                const month = second;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else if (parseInt(second) > 12) {
                // Second number > 12, must be M D Y
                const month = first;
                const day = second;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            } else {
                // Ambiguous - default to M D Y (US format)
                const month = first;
                const day = second;
                return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
            }
        }

        // If already in YYYY-MM-DD format
        if (dateStr.match(/\d{4}-\d{2}-\d{2}/)) {
            return dateStr;
        }

        // Try to parse as Date and convert
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
            return this.formatDateKey(date);
        }

        return dateStr;
    }

    parseTextData(content) {
        // Remove BOM if present
        let cleanContent = content;
        if (content.charCodeAt(0) === 0xFEFF) {
            cleanContent = content.substring(1);
        }
        cleanContent = cleanContent.replace(/^\uFEFF/, '').replace(/^\xEF\xBB\xBF/, '');

        // Simple text format: Engineer Name: Date = Status
        const lines = cleanContent.split('\n').filter(line => line.trim());

        lines.forEach(line => {
            const match = line.match(/(.+?):\s*(.+?)\s*=\s*(.+)/);
            if (match) {
                const engineerName = match[1].trim();
                const date = match[2].trim();
                const status = match[3].trim();

                let engineer = this.engineers.find(e => this.nameTokensMatch(e.name, engineerName));

                if (!engineer) {
                    engineer = {
                        id: Date.now() + Math.random(),
                        name: this.normalizeName(engineerName),
                        icon: this.getRandomIcon()
                    };
                    this.engineers.push(engineer);
                }

                if (!this.attendanceData[engineer.id]) {
                    this.attendanceData[engineer.id] = {};
                }

                this.attendanceData[engineer.id][date] = status.toUpperCase();
            }
        });
    }

    getRandomIcon() {
        const icons = ['👨‍💻', '👩‍💻', '🧑‍💻'];
        return icons[Math.floor(Math.random() * icons.length)];
    }

    showTemporaryMessage(message, type = 'success') {
        // Create message element
        const messageDiv = document.createElement('div');
        messageDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 6px;
            color: white;
            font-weight: bold;
            z-index: 10000;
            opacity: 1;
            transition: opacity 0.5s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            ${type === 'success' ? 'background: #48bb78;' : 'background: #f56565;'}
        `;
        messageDiv.textContent = message;

        // Add to page
        document.body.appendChild(messageDiv);

        // Remove after 3 seconds with fade out
        setTimeout(() => {
            messageDiv.style.opacity = '0';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 500); // Wait for fade out animation
        }, 3000);
    }

    normalizeName(name) {
        if (!name) return '';

        return name
            .toString()
            .replace(/ñ/g, 'n')  // lowercase ñ → n
            .replace(/Ñ/g, 'N')  // uppercase Ñ → N
            .replace(/�/g, 'N')  // corrupted character → N (handles encoding issues)
            .replace(/á/g, 'a')
            .replace(/Á/g, 'A')
            .replace(/é/g, 'e')
            .replace(/É/g, 'E')
            .replace(/í/g, 'i')
            .replace(/Í/g, 'I')
            .replace(/ó/g, 'o')
            .replace(/Ó/g, 'O')
            .replace(/ú/g, 'u')
            .replace(/Ú/g, 'U')
            .toUpperCase()
            .trim();
    }

    // Smart name matching that handles different name orders
    nameTokensMatch(name1, name2) {
        if (!name1 || !name2) return false;

        // Normalize both names first
        const normalized1 = this.normalizeName(name1);
        const normalized2 = this.normalizeName(name2);

        // If they're exactly the same, they match
        if (normalized1 === normalized2) return true;

        // Extract tokens (words) from both names, remove commas and extra punctuation
        const tokens1 = normalized1
            .replace(/,/g, ' ')  // Remove commas
            .replace(/[^\w\s]/g, ' ')  // Remove other punctuation
            .split(/\s+/)  // Split by spaces
            .filter(token => token.length > 1);  // Keep only meaningful tokens

        const tokens2 = normalized2
            .replace(/,/g, ' ')
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(token => token.length > 1);

        // Check if they have the same set of tokens (regardless of order)
        if (tokens1.length !== tokens2.length) return false;

        // All tokens from name1 should exist in name2
        return tokens1.every(token => tokens2.includes(token));
    }

    renderTable() {
        this.renderTableHeader();
        this.renderTableBody();
    }

    renderTableHeader() {
        const header = document.getElementById('tableHeader');
        const dates = this.getDateRange();

        header.innerHTML = `
            <tr>
                <th>Engineer</th>
                ${dates.map(date => `<th>${this.formatDateHeader(date)}</th>`).join('')}
            </tr>
        `;
    }

    renderTableBody() {
        const body = document.getElementById('tableBody');
        const dates = this.getDateRange();

        if (this.engineers.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="${dates.length + 1}" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                        📁 No engineers found. Please upload attendance files or add engineers manually.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = this.engineers.map(engineer => {
            const attendance = dates.map(date => {
                const dateKey = this.formatDateKey(date);
                const status = this.attendanceData[engineer.id] && this.attendanceData[engineer.id][dateKey] || '';
                return { date: dateKey, status };
            });

            return `
                <tr>
                    <td class="engineer-name">${engineer.name}</td>
                    ${attendance.map(({ date, status }) =>
                        `<td>${status ? this.renderStatusBadge(status, engineer.id, date) : '<span style="color: #ccc;">-</span>'}</td>`
                    ).join('')}
                </tr>
            `;
        }).join('');
    }


    getDateRange() {
        const dates = [];
        const current = new Date(this.currentWeekStart);
        const end = new Date(this.currentWeekEnd);

        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    renderStatusBadge(status, engineerId, date) {
        // Handle missing minutes (numbers represent minutes short of 9 hours)
        if (typeof status === 'number' || (!isNaN(status) && status !== 'IN' && status !== 'SICK' && status !== 'VL' && status !== 'ABSNT')) {
            return `<span class="status-missing" onclick="attendanceApp.editStatus(${engineerId}, '${date}', '${status}')">${status}</span>`;
        }

        const statusClass = `status-${status.toLowerCase()}`;
        return `<span class="${statusClass}" onclick="attendanceApp.editStatus(${engineerId}, '${date}', '${status}')">${status}</span>`;
    }


    updateSummaryStats() {
        const dates = this.getDateRange();
        let totalDays = 0;
        let present = 0;
        let sick = 0;
        let vacation = 0;
        let absent = 0;

        if (this.engineers.length > 0) {
            this.engineers.forEach(engineer => {
                dates.forEach(date => {
                    const dateKey = this.formatDateKey(date);
                    const status = this.attendanceData[engineer.id] && this.attendanceData[engineer.id][dateKey] || 'IN';

                    totalDays++;

                    if (status === 'IN' || (!isNaN(status) && status !== 'ABSNT')) {
                        present++;
                    } else if (status === 'SICK') {
                        sick++;
                    } else if (status === 'VL') {
                        vacation++;
                    } else if (status === 'ABSNT') {
                        absent++;
                    }
                });
            });
        }

        document.getElementById('summaryStats').innerHTML = `
            <div class="stat-card">
                <div class="stat-number">${totalDays}</div>
                <div class="stat-label">Total Days</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${present}</div>
                <div class="stat-label">Present</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${sick}</div>
                <div class="stat-label">Sick Leave</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${vacation}</div>
                <div class="stat-label">Vacation</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">${absent}</div>
                <div class="stat-label">Absent</div>
            </div>
        `;
    }

    editStatus(engineerId, date, currentStatus) {
        this.currentEditEngineer = engineerId;
        this.currentEditDate = date;

        const engineer = this.engineers.find(e => e.id == engineerId);
        const dateObj = new Date(date);

        document.getElementById('editEngineerName').value = engineer.name;
        document.getElementById('editDate').value = dateObj.toLocaleDateString();

        if (!isNaN(currentStatus)) {
            document.getElementById('editStatus').value = 'LATE';
            document.getElementById('lateMinutes').value = currentStatus;
            document.getElementById('lateMinutesGroup').style.display = 'block';
        } else {
            document.getElementById('editStatus').value = currentStatus;
            document.getElementById('lateMinutesGroup').style.display = 'none';
        }

        document.getElementById('editStatusModal').style.display = 'block';
    }

    updateStatus() {
        const status = document.getElementById('editStatus').value;
        const lateMinutes = document.getElementById('lateMinutes').value;

        let finalStatus = status;
        if (status === 'LATE' && lateMinutes) {
            finalStatus = parseInt(lateMinutes);
        }

        if (!this.attendanceData[this.currentEditEngineer]) {
            this.attendanceData[this.currentEditEngineer] = {};
        }

        this.attendanceData[this.currentEditEngineer][this.currentEditDate] = finalStatus;

        this.closeEditStatusModal();
        this.renderTable();
        this.updateSummaryStats();
        this.saveData();
    }

    openAddEngineerModal() {
        document.getElementById('addEngineerModal').style.display = 'block';
    }

    closeAddEngineerModal() {
        document.getElementById('addEngineerModal').style.display = 'none';
        document.getElementById('addEngineerForm').reset();
    }

    closeEditStatusModal() {
        document.getElementById('editStatusModal').style.display = 'none';
        document.getElementById('editStatusForm').reset();
    }

    addEngineer() {
        const name = document.getElementById('engineerName').value.trim();

        if (!name) {
            return; // Name required but not provided
        }

        if (this.engineers.find(e => this.nameTokensMatch(e.name, name))) {
            alert('An engineer with this name already exists.');
            return;
        }

        const newEngineer = {
            id: Date.now(),
            name: name,
            icon: this.getRandomIcon()
        };

        this.engineers.push(newEngineer);
        this.attendanceData[newEngineer.id] = {};

        this.closeAddEngineerModal();
        this.renderTable();
        this.updateSummaryStats();
        this.saveData();

        // Engineer added successfully - no need for dialog
    }

    exportToCSV() {
        if (this.engineers.length === 0) {
            alert('No data to export. Please upload attendance files first.');
            return;
        }

        const dates = this.getDateRange();
        let csv = 'Engineer,' + dates.map(d => this.formatDateForExport(d)).join(',') + '\n';

        this.engineers.forEach(engineer => {
            const row = [engineer.name];

            dates.forEach(date => {
                const dateKey = this.formatDateKey(date);
                const status = this.attendanceData[engineer.id] && this.attendanceData[engineer.id][dateKey] || '';
                row.push(status || '-');
            });

            csv += row.join(',') + '\n';
        });

        // Download CSV
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `attendance-report-${this.formatDateKey(this.currentWeekStart)}-to-${this.formatDateKey(this.currentWeekEnd)}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    exportToExcel() {
        if (this.engineers.length === 0) {
            alert('No data to export. Please upload attendance files first.');
            return;
        }

        // Check if XLSX library is loaded
        if (typeof XLSX === 'undefined') {
            alert('Excel export library not loaded. Please refresh the page and try again.');
            return;
        }

        const dates = this.getDateRange();

        // Prepare data array
        const data = [];

        // Header row
        const headerRow = ['Engineer', ...dates.map(d => this.formatDateForExport(d))];
        data.push(headerRow);

        // Data rows
        this.engineers.forEach(engineer => {
            const row = [engineer.name];
            dates.forEach(date => {
                const dateKey = this.formatDateKey(date);
                const status = this.attendanceData[engineer.id] && this.attendanceData[engineer.id][dateKey] || '';
                row.push(status || '-');
            });
            data.push(row);
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Set column widths
        const colWidths = [{ width: 25 }]; // Engineer column
        dates.forEach(() => colWidths.push({ width: 12 })); // Date columns
        ws['!cols'] = colWidths;

        // Apply Tahoma font size 8 styling to all cells
        const range = XLSX.utils.decode_range(ws['!ref']);

        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });

                if (!ws[cellAddress]) continue;

                // Set cell style
                ws[cellAddress].s = {
                    font: {
                        name: 'Tahoma',
                        sz: 8
                    },
                    alignment: {
                        horizontal: 'center',
                        vertical: 'center'
                    },
                    border: {
                        top: { style: 'thin' },
                        bottom: { style: 'thin' },
                        left: { style: 'thin' },
                        right: { style: 'thin' }
                    }
                };

                // Header row styling
                if (row === 0) {
                    ws[cellAddress].s.fill = {
                        fgColor: { rgb: '667eea' }
                    };
                    ws[cellAddress].s.font.color = { rgb: 'FFFFFF' };
                    ws[cellAddress].s.font.bold = true;
                }

                // Engineer name column alignment
                if (col === 0 && row > 0) {
                    ws[cellAddress].s.alignment.horizontal = 'left';
                }
            }
        }

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Attendance Report');

        // Generate filename
        const filename = `attendance-report-${this.formatDateKey(this.currentWeekStart)}-to-${this.formatDateKey(this.currentWeekEnd)}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear ALL data? This will remove all engineers, attendance records, and uploaded files. This action cannot be undone.')) {
            this.engineers = [];
            this.attendanceData = {};
            this.uploadedFiles = [];

            localStorage.removeItem('timetagEngineers');
            localStorage.removeItem('timetagAttendance');
            localStorage.removeItem('timetagFiles');

            this.updateFileList();
            this.renderTable();
            this.updateSummaryStats();

            this.showTemporaryMessage('✅ All data has been cleared. You can now start fresh!', 'success');
        }
    }

    // Schedule Management Methods
    async handleScheduleFileSelection(files) {
        const fileArray = Array.from(files);
        const validFiles = fileArray.filter(file => {
            // Accept based on file extension (more reliable than MIME type)
            const fileName = file.name.toLowerCase();
            return fileName.endsWith('.csv') ||
                   fileName.endsWith('.json') ||
                   fileName.endsWith('.txt') ||
                   fileName.endsWith('.xlsx') ||
                   fileName.endsWith('.xls');
        });

        if (validFiles.length === 0) {
            alert('Please select valid files (.csv, .json, .txt, .xls, or .xlsx)');
            return;
        }

        // Automatically process the uploaded files
        let processed = 0;
        for (const file of validFiles) {
            try {
                await this.parseScheduleFile(file);
                processed++;

                // Add to uploaded files list for tracking
                if (!this.uploadedScheduleFiles.find(f => f.name === file.name)) {
                    this.uploadedScheduleFiles.push({
                        name: file.name,
                        size: file.size,
                        type: file.type,
                        uploadTime: new Date().toISOString(),
                        file: file
                    });
                }
            } catch (error) {
                console.error('Error processing schedule file:', file.name, error);
                alert(`Error processing file ${file.name}: ${error.message}`);
            }
        }

        this.renderScheduleTable();
        this.saveData();

        if (processed > 0) {
            // Schedule files processed successfully - no need for dialog
        }
    }


    async parseScheduleFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                try {
                    const content = e.target.result;

                    if (file.name.endsWith('.json')) {
                        this.parseScheduleJSONData(content);
                    } else if (file.name.endsWith('.csv')) {
                        this.parseScheduleCSVData(content);
                    } else {
                        this.parseScheduleTextData(content);
                    }

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };

            reader.onerror = () => reject(reader.error);
            reader.readAsText(file);
        });
    }

    parseScheduleJSONData(content) {
        const data = JSON.parse(content);
        // Expected format: { "engineerName": { "date": "scheduleType" } }
        Object.keys(data).forEach(engineerName => {
            let engineer = this.engineers.find(e => this.nameTokensMatch(e.name, engineerName));

            if (!engineer) {
                engineer = {
                    id: Date.now() + Math.random(),
                    name: this.normalizeName(engineerName),
                    icon: this.getRandomIcon()
                };
                this.engineers.push(engineer);
                this.attendanceData[engineer.id] = {};
            }

            if (!this.scheduleData[engineer.id]) {
                this.scheduleData[engineer.id] = {};
            }

            Object.keys(data[engineerName]).forEach(date => {
                const scheduleType = data[engineerName][date];
                this.scheduleData[engineer.id][date] = scheduleType;
            });
        });
    }

    parseScheduleCSVData(content) {
        const lines = content.split('\n').filter(line => line.trim());
        const headers = lines[0].split(',').map(h => h.trim());

        // Expected format: Engineer, ShiftStart, UsRd, MlaRd
        for (let i = 1; i < lines.length; i++) {
            const values = this.parseCSVLine(lines[i]);

            // Skip empty lines
            if (values.length === 0 || (values.length === 1 && values[0] === '')) {
                continue;
            }

            if (values.length >= 4) {
                const engineer = values[0].trim();
                const shiftStart = values[1].trim();
                const usRd = values[2].trim();
                const mlaRd = values[3].trim();

                // Check if engineer already exists in schedules
                const existingIndex = this.engineerSchedules.findIndex(s =>
                    this.normalizeName(s.engineer) === this.normalizeName(engineer)
                );

                const scheduleEntry = {
                    engineer: engineer,
                    shiftStart: shiftStart,
                    usRd: usRd,
                    mlaRd: mlaRd
                };

                if (existingIndex >= 0) {
                    // Update existing schedule
                    this.engineerSchedules[existingIndex] = scheduleEntry;
                } else {
                    // Add new schedule
                    this.engineerSchedules.push(scheduleEntry);
                }
            }
        }
    }

    parseScheduleTextData(content) {
        // Simple text format: Engineer Name: Date = ScheduleType StartTime-EndTime
        const lines = content.split('\n').filter(line => line.trim());

        lines.forEach(line => {
            const match = line.match(/(.+?):\s*(.+?)\s*=\s*(.+)/);
            if (match) {
                const engineerName = match[1].trim();
                const date = this.parseDate(match[2].trim());
                const scheduleInfo = match[3].trim().split(' ');
                const scheduleType = scheduleInfo[0].toUpperCase();

                let engineer = this.engineers.find(e => this.nameTokensMatch(e.name, engineerName));

                if (!engineer) {
                    engineer = {
                        id: Date.now() + Math.random(),
                        name: this.normalizeName(engineerName),
                        icon: this.getRandomIcon()
                    };
                    this.engineers.push(engineer);
                    this.attendanceData[engineer.id] = {};
                }

                if (!this.scheduleData[engineer.id]) {
                    this.scheduleData[engineer.id] = {};
                }

                this.scheduleData[engineer.id][date] = {
                    type: scheduleType,
                    startTime: scheduleInfo[1] ? scheduleInfo[1].split('-')[0] : '',
                    endTime: scheduleInfo[1] ? scheduleInfo[1].split('-')[1] : ''
                };
            }
        });
    }

    setDefaultSchedulePeriod() {
        // Set default to November 17-23, 2025 to match attendance data
        // Create dates in local time to avoid timezone offset issues
        const weekStart = new Date(2025, 10, 17); // Month is 0-indexed (10 = November)
        const weekEnd = new Date(2025, 10, 23);

        this.currentScheduleStart = weekStart;
        this.currentScheduleEnd = weekEnd;

        document.getElementById('scheduleStartDate').value = this.formatDateInput(weekStart);
        document.getElementById('scheduleEndDate').value = this.formatDateInput(weekEnd);
    }

    updateScheduleView() {
        // Parse date string as local date to avoid timezone issues
        const startDateStr = document.getElementById('scheduleStartDate').value;
        const endDateStr = document.getElementById('scheduleEndDate').value;

        const startParts = startDateStr.split('-');
        const endParts = endDateStr.split('-');

        const startDate = new Date(parseInt(startParts[0]), parseInt(startParts[1]) - 1, parseInt(startParts[2]));
        const endDate = new Date(parseInt(endParts[0]), parseInt(endParts[1]) - 1, parseInt(endParts[2]));

        this.currentScheduleStart = startDate;
        this.currentScheduleEnd = endDate;

        this.renderScheduleTable();
    }

    renderScheduleTable() {
        const body = document.getElementById('scheduleTableBody');

        if (this.engineerSchedules.length === 0) {
            body.innerHTML = `
                <tr>
                    <td colspan="4" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                        📅 No engineer schedules found. Please upload schedule files or add schedules manually.
                    </td>
                </tr>
            `;
            return;
        }

        body.innerHTML = this.engineerSchedules.map((schedule, index) => `
            <tr onclick="attendanceApp.editEngineerSchedule(${index})" style="cursor: pointer;">
                <td class="engineer-name">${schedule.engineer}</td>
                <td style="text-align: center;">${schedule.shiftStart}</td>
                <td style="text-align: center;">${schedule.usRd}</td>
                <td style="text-align: center;">${schedule.mlaRd}</td>
            </tr>
        `).join('');
    }

    getScheduleDateRange() {
        if (!this.currentScheduleStart || !this.currentScheduleEnd) {
            this.setDefaultSchedulePeriod();
        }

        const dates = [];
        const current = new Date(this.currentScheduleStart);
        const end = new Date(this.currentScheduleEnd);

        while (current <= end) {
            dates.push(new Date(current));
            current.setDate(current.getDate() + 1);
        }

        return dates;
    }

    renderScheduleBadge(schedule, engineerId, date) {
        const scheduleType = typeof schedule === 'string' ? schedule : schedule.type;
        const statusClass = `status-${scheduleType.toLowerCase()}`;
        return `<span class="${statusClass}" onclick="attendanceApp.editSchedule(${engineerId}, '${date}', '${scheduleType}')">${scheduleType}</span>`;
    }

    openAddScheduleModal() {
        // Pre-populate bulk entry with sample data (with header)
        const sampleData = `ENGINEER,SHIFT START,US RD,MLA RD
GREGGY JIM IVAN PADRIQUE,9:00 PM,SUN MON,SUN MON
KIMBERLY GABIONZA,9:00 PM,WED THU,WED THU
ARABELLA ANORA,11:00 PM,THU FRI,THU FRI
BIANCA DESIREE GALANG,12:00 AM,SAT SUN,SUN MON
MAEVEL PALABOL,12:00 AM,FRI SAT,SAT SUN
PETER NEIL MALABAY,3:00 AM,FRI SAT,SAT SUN
MARK LIONEL MASILANG,4:00 AM,FRI SAT,SAT SUN
JUDY ANN FERNANDEZ,6:00 AM,THU FRI,FRI SAT
EMRIC QUIOGUE,8:00 AM,SAT SUN,SUN MON
ANDREA NICHOLE TOJINO,8:00 AM,WED THU,THU FRI
ERIKA LANSANGAN,12:00 PM,SAT SUN,SUN MON
JOSE JURAMER LABSO,3:00 PM,FRI SAT,SAT SUN`;

        document.getElementById('bulkScheduleData').value = sampleData;
        document.getElementById('addScheduleModal').style.display = 'block';
    }

    closeAddScheduleModal() {
        document.getElementById('addScheduleModal').style.display = 'none';
        document.getElementById('addScheduleForm').reset();
        document.getElementById('addBulkScheduleForm').reset();

        // Reset to single entry tab
        this.switchScheduleTab('single');
    }

    switchScheduleTab(tabName) {
        // Hide all tab contents
        document.getElementById('singleEntryTab').classList.remove('active');
        document.getElementById('bulkEntryTab').classList.remove('active');

        // Remove active class from all buttons
        document.querySelectorAll('.schedule-tab-btn').forEach(btn => btn.classList.remove('active'));

        // Get the buttons to update their text
        const submitButton = document.querySelector('.modal-actions-top .btn-primary');
        const saveButton = document.querySelector('.modal-actions-top .btn-save');

        // Show selected tab and update button texts
        if (tabName === 'single') {
            document.getElementById('singleEntryTab').classList.add('active');
            document.querySelectorAll('.schedule-tab-btn')[0].classList.add('active');
            submitButton.textContent = '✅ Add Schedule';
            saveButton.textContent = '💾 Save Current Schedules';
        } else if (tabName === 'bulk') {
            document.getElementById('bulkEntryTab').classList.add('active');
            document.querySelectorAll('.schedule-tab-btn')[1].classList.add('active');
            submitButton.textContent = '✅ Add All Schedules';
            saveButton.textContent = '💾 Save Bulk Data';
        }
    }

    editEngineerSchedule(index) {
        this.currentEditScheduleIndex = index;
        const schedule = this.engineerSchedules[index];

        document.getElementById('editScheduleEngineer').value = schedule.engineer;
        document.getElementById('editScheduleShiftStart').value = schedule.shiftStart;
        document.getElementById('editScheduleUsRd').value = schedule.usRd;
        document.getElementById('editScheduleMlaRd').value = schedule.mlaRd;

        document.getElementById('editScheduleModal').style.display = 'block';
    }

    closeEditScheduleModal() {
        document.getElementById('editScheduleModal').style.display = 'none';
        document.getElementById('editScheduleForm').reset();
    }

    addSchedule() {
        const engineerName = document.getElementById('scheduleEngineerName').value;
        const shiftStart = document.getElementById('scheduleShiftStart').value;
        const usRd = document.getElementById('scheduleUsRd').value;
        const mlaRd = document.getElementById('scheduleMlaRd').value;

        if (!engineerName || !shiftStart || !usRd || !mlaRd) {
            // Required fields validation - no alert needed
            return;
        }

        // Check if engineer already exists in schedules
        const existingIndex = this.engineerSchedules.findIndex(s =>
            this.nameTokensMatch(s.engineer, engineerName)
        );

        const scheduleEntry = {
            engineer: engineerName.toUpperCase(),
            shiftStart: shiftStart,
            usRd: usRd.toUpperCase(),
            mlaRd: mlaRd.toUpperCase()
        };

        if (existingIndex >= 0) {
            // Update existing schedule
            this.engineerSchedules[existingIndex] = scheduleEntry;
            // Schedule updated successfully - no need for dialog
        } else {
            // Add new schedule
            this.engineerSchedules.push(scheduleEntry);
            // Schedule added successfully - no need for dialog
        }

        this.closeAddScheduleModal();
        this.renderScheduleTable();
        this.saveData();
    }

    addBulkSchedules() {
        const bulkData = document.getElementById('bulkScheduleData').value.trim();

        if (!bulkData) {
            // No schedule data provided
            return;
        }

        const lines = bulkData.split('\n').filter(line => line.trim());
        let processed = 0;
        let errors = [];

        lines.forEach((line, index) => {
            try {
                const values = this.parseCSVLine(line);

                // Skip header row if detected (more flexible)
                if (index === 0 && values.length >= 2 &&
                    (values[0].toLowerCase().includes('engineer') || values[0].toLowerCase().includes('name')) &&
                    (values[1].toLowerCase().includes('shift') || values[1].toLowerCase().includes('start') || values[1].toLowerCase().includes('time'))) {
                    return; // Skip header row
                }

                // Flexible parsing - only require name and shift start
                if (values.length < 2) {
                    errors.push(`Line ${index + 1}: Need at least 2 values: Engineer Name, Shift Start Time`);
                    return;
                }

                const engineerName = values[0].trim();
                const shiftStart = values[1].trim();
                const usRd = values.length > 2 ? values[2].trim() : '';
                const mlaRd = values.length > 3 ? values[3].trim() : '';

                if (!engineerName || !shiftStart) {
                    errors.push(`Line ${index + 1}: Missing required data (Engineer Name and Shift Start required)`);
                    return;
                }

                // Check if engineer already exists in schedules
                const existingIndex = this.engineerSchedules.findIndex(s =>
                    this.nameTokensMatch(s.engineer, engineerName)
                );

                const scheduleEntry = {
                    engineer: engineerName.toUpperCase(),
                    shiftStart: shiftStart,
                    usRd: usRd.toUpperCase(),
                    mlaRd: mlaRd.toUpperCase()
                };

                if (existingIndex >= 0) {
                    // Update existing schedule
                    this.engineerSchedules[existingIndex] = scheduleEntry;
                } else {
                    // Add new schedule
                    this.engineerSchedules.push(scheduleEntry);
                }

                processed++;

            } catch (error) {
                errors.push(`Line ${index + 1}: ${error.message}`);
            }
        });

        // Show results
        let message = `✅ Successfully processed ${processed} schedule(s).`;

        if (errors.length > 0) {
            message += `\n\n⚠️ Errors encountered:\n${errors.slice(0, 5).join('\n')}`;
            if (errors.length > 5) {
                message += `\n... and ${errors.length - 5} more errors.`;
            }
        }

        alert(message);

        this.closeAddScheduleModal();
        this.renderScheduleTable();
        this.saveData();
    }

    saveScheduleData() {
        const bulkData = document.getElementById('bulkScheduleData').value.trim();

        if (!bulkData) {
            alert('No schedule data to save. Please enter schedule data first.');
            return;
        }

        // Prepare CSV content with header
        let csvContent = 'ENGINEER,SHIFT START,US RD,MLA RD\n';
        csvContent += bulkData;

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `engineer-schedules-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Schedule data saved successfully - no need for dialog
    }

    exportCurrentSchedules() {
        if (this.engineerSchedules.length === 0) {
            alert('No schedules to save. Please add some engineer schedules first.');
            return;
        }

        // Create CSV content with header
        let csvContent = 'ENGINEER,SHIFT START,US RD,MLA RD\n';

        // Add all current schedules
        this.engineerSchedules.forEach(schedule => {
            csvContent += `${schedule.engineer},${schedule.shiftStart},${schedule.usRd},${schedule.mlaRd}\n`;
        });

        // Create and download the file
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `current-engineer-schedules-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);

        // Current schedules exported successfully - no need for dialog
    }

    submitCurrentForm() {
        // Check which tab is currently active
        const singleEntryTab = document.getElementById('singleEntryTab');
        const bulkEntryTab = document.getElementById('bulkEntryTab');

        if (singleEntryTab.classList.contains('active')) {
            // Submit single entry form
            this.addSchedule();
        } else if (bulkEntryTab.classList.contains('active')) {
            // Submit bulk entry form
            this.addBulkSchedules();
        }
    }

    saveCurrentData() {
        // Check which tab is currently active
        const singleEntryTab = document.getElementById('singleEntryTab');
        const bulkEntryTab = document.getElementById('bulkEntryTab');

        if (singleEntryTab.classList.contains('active')) {
            // Save single entry data without closing modal
            const engineerName = document.getElementById('scheduleEngineerName').value;
            const shiftStart = document.getElementById('scheduleShiftStart').value;
            const usRd = document.getElementById('scheduleUsRd').value;
            const mlaRd = document.getElementById('scheduleMlaRd').value;

            if (!engineerName || !shiftStart || !usRd || !mlaRd) {
                alert('Please fill in all required fields before saving.');
                return;
            }

            // Check if engineer already exists in schedules
            const existingIndex = this.engineerSchedules.findIndex(s =>
                this.nameTokensMatch(s.engineer, engineerName)
            );

            const scheduleEntry = {
                engineer: engineerName.toUpperCase(),
                shiftStart: shiftStart,
                usRd: usRd.toUpperCase(),
                mlaRd: mlaRd.toUpperCase()
            };

            if (existingIndex >= 0) {
                // Update existing schedule
                this.engineerSchedules[existingIndex] = scheduleEntry;
                // Schedule saved successfully - no need for dialog
            } else {
                // Add new schedule
                this.engineerSchedules.push(scheduleEntry);
                // Schedule saved successfully - no need for dialog
            }

            // Update display and save to localStorage
            this.renderScheduleTable();
            this.saveData();

            // Clear the form for next entry
            document.getElementById('addScheduleForm').reset();

        } else if (bulkEntryTab.classList.contains('active')) {
            // Save bulk entry data without downloading
            const bulkData = document.getElementById('bulkScheduleData').value.trim();

            if (!bulkData) {
                // No schedule data entered
                return;
            }

            const lines = bulkData.split('\n').filter(line => line.trim());
            let processed = 0;
            let errors = [];

            lines.forEach((line, index) => {
                try {
                    const values = this.parseCSVLine(line);

                    // Skip header row if detected (more flexible)
                    if (index === 0 && values.length >= 2 &&
                        (values[0].toLowerCase().includes('engineer') || values[0].toLowerCase().includes('name')) &&
                        (values[1].toLowerCase().includes('shift') || values[1].toLowerCase().includes('start') || values[1].toLowerCase().includes('time'))) {
                        return; // Skip header row
                    }

                    // Flexible parsing - only require name and shift start
                    if (values.length < 2) {
                        errors.push(`Line ${index + 1}: Need at least 2 values: Engineer Name, Shift Start Time`);
                        return;
                    }

                    const engineerName = values[0].trim();
                    const shiftStart = values[1].trim();
                    const usRd = values.length > 2 ? values[2].trim() : '';
                    const mlaRd = values.length > 3 ? values[3].trim() : '';

                    if (!engineerName || !shiftStart) {
                        errors.push(`Line ${index + 1}: Missing required data (Engineer Name and Shift Start required)`);
                        return;
                    }

                    // Check if engineer already exists in schedules
                    const existingIndex = this.engineerSchedules.findIndex(s =>
                        this.nameTokensMatch(s.engineer, engineerName)
                    );

                    const scheduleEntry = {
                        engineer: engineerName.toUpperCase(),
                        shiftStart: shiftStart,
                        usRd: usRd.toUpperCase(),
                        mlaRd: mlaRd.toUpperCase()
                    };

                    if (existingIndex >= 0) {
                        // Update existing schedule
                        this.engineerSchedules[existingIndex] = scheduleEntry;
                    } else {
                        // Add new schedule
                        this.engineerSchedules.push(scheduleEntry);
                    }

                    processed++;

                } catch (error) {
                    errors.push(`Line ${index + 1}: ${error.message}`);
                }
            });

            // Update display and save to localStorage
            this.renderScheduleTable();
            this.saveData();

            // Show results
            let message = `💾 Successfully saved ${processed} schedule(s).`;
            if (errors.length > 0) {
                message += `\n\n⚠️ Errors: ${errors.slice(0, 3).join('\n')}`;
                if (errors.length > 3) {
                    message += `\n... and ${errors.length - 3} more errors.`;
                }
            }
            alert(message);
        }
    }

    updateSchedule() {
        const shiftStart = document.getElementById('editScheduleShiftStart').value;
        const usRd = document.getElementById('editScheduleUsRd').value;
        const mlaRd = document.getElementById('editScheduleMlaRd').value;

        if (!shiftStart || !usRd || !mlaRd) {
            // Required fields validation - no alert needed
            return;
        }

        if (this.currentEditScheduleIndex !== null) {
            this.engineerSchedules[this.currentEditScheduleIndex] = {
                engineer: this.engineerSchedules[this.currentEditScheduleIndex].engineer,
                shiftStart: shiftStart,
                usRd: usRd.toUpperCase(),
                mlaRd: mlaRd.toUpperCase()
            };

            this.closeEditScheduleModal();
            this.renderScheduleTable();
            this.saveData();

            // Schedule updated successfully - no need for dialog
        }
    }

    exportScheduleToCSV() {
        if (this.engineerSchedules.length === 0) {
            alert('No schedule data to export.');
            return;
        }

        let csv = 'ENGINEER,SHIFT START,US RD,MLA RD\n';

        this.engineerSchedules.forEach(schedule => {
            const row = [
                schedule.engineer,
                schedule.shiftStart,
                schedule.usRd,
                schedule.mlaRd
            ];
            csv += row.join(',') + '\n';
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `engineer-schedules-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    }

    exportScheduleToExcel() {
        if (this.engineerSchedules.length === 0) {
            alert('No schedule data to export.');
            return;
        }

        if (typeof XLSX === 'undefined') {
            alert('Excel export library not loaded. Please refresh the page and try again.');
            return;
        }

        const data = [];

        // Header row
        const headerRow = ['ENGINEER', 'SHIFT START', 'US RD', 'MLA RD'];
        data.push(headerRow);

        // Data rows
        this.engineerSchedules.forEach(schedule => {
            const row = [
                schedule.engineer,
                schedule.shiftStart,
                schedule.usRd,
                schedule.mlaRd
            ];
            data.push(row);
        });

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.aoa_to_sheet(data);

        // Apply formatting with Tahoma font
        const range = XLSX.utils.decode_range(ws['!ref']);
        const colWidths = [
            { width: 35 }, // ENGINEER
            { width: 15 }, // SHIFT START
            { width: 15 }, // US RD
            { width: 15 }  // MLA RD
        ];
        ws['!cols'] = colWidths;

        for (let row = range.s.r; row <= range.e.r; row++) {
            for (let col = range.s.c; col <= range.e.c; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                if (!ws[cellAddress]) continue;

                ws[cellAddress].s = {
                    font: { name: 'Tahoma', sz: 8 },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        top: { style: 'thin' }, bottom: { style: 'thin' },
                        left: { style: 'thin' }, right: { style: 'thin' }
                    }
                };

                if (row === 0) {
                    ws[cellAddress].s.fill = { fgColor: { rgb: '667eea' } };
                    ws[cellAddress].s.font.color = { rgb: 'FFFFFF' };
                    ws[cellAddress].s.font.bold = true;
                }

                if (col === 0 && row > 0) {
                    ws[cellAddress].s.alignment.horizontal = 'left';
                }
            }
        }

        XLSX.utils.book_append_sheet(wb, ws, 'Engineer Schedules');

        const filename = `engineer-schedules-${new Date().toISOString().split('T')[0]}.xlsx`;
        XLSX.writeFile(wb, filename);
    }

    clearScheduleData() {
        if (confirm('Are you sure you want to clear ALL schedule data? This will remove all engineer schedules and uploaded schedule files. This action cannot be undone.')) {
            this.engineerSchedules = [];
            this.uploadedScheduleFiles = [];

            localStorage.removeItem('timetagEngineerSchedules');
            localStorage.removeItem('timetagScheduleFiles');

            this.renderScheduleTable();

            this.showTemporaryMessage('✅ All schedule data has been cleared.', 'success');
        }
    }
}

// Global functions for onclick handlers
function processFiles() {
    attendanceApp.processFiles();
}

function updateDateRange() {
    attendanceApp.updateDateRange();
}

function exportToCSV() {
    attendanceApp.exportToCSV();
}

function exportToExcel() {
    attendanceApp.exportToExcel();
}

function openAddEngineerModal() {
    attendanceApp.openAddEngineerModal();
}

function closeAddEngineerModal() {
    attendanceApp.closeAddEngineerModal();
}

function closeEditStatusModal() {
    attendanceApp.closeEditStatusModal();
}

function clearAllData() {
    attendanceApp.clearAllData();
}

// Schedule Global Functions

function openAddScheduleModal() {
    attendanceApp.openAddScheduleModal();
}

function closeAddScheduleModal() {
    attendanceApp.closeAddScheduleModal();
}

function closeEditScheduleModal() {
    attendanceApp.closeEditScheduleModal();
}

function clearScheduleData() {
    attendanceApp.clearScheduleData();
}

function switchScheduleTab(tabName) {
    attendanceApp.switchScheduleTab(tabName);
}

// Tab Management
function switchTab(tabName) {
    // Hide all tabs
    document.getElementById('attendanceTab').classList.remove('active');
    document.getElementById('schedulesTab').classList.remove('active');

    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    if (tabName === 'attendance') {
        document.getElementById('attendanceTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[0].classList.add('active');
    } else if (tabName === 'schedules') {
        document.getElementById('schedulesTab').classList.add('active');
        document.querySelectorAll('.tab-btn')[1].classList.add('active');

        // Initialize schedule view
        attendanceApp.renderScheduleTable();
    }
}

// Initialize the app
const attendanceApp = new AttendanceManager();

// Close modals when clicking outside
window.onclick = function(event) {
    const addModal = document.getElementById('addEngineerModal');
    const editModal = document.getElementById('editStatusModal');
    const addScheduleModal = document.getElementById('addScheduleModal');
    const editScheduleModal = document.getElementById('editScheduleModal');

    if (event.target === addModal) {
        closeAddEngineerModal();
    } else if (event.target === editModal) {
        closeEditStatusModal();
    } else if (event.target === addScheduleModal) {
        closeAddScheduleModal();
    } else if (event.target === editScheduleModal) {
        closeEditScheduleModal();
    }
};