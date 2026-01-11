# Project TimeTag - Attendance Management System

A fully functional attendance tracking and management system designed to help Squad Leads efficiently manage engineer attendance.

## 🚀 How to Use

### Opening the Application
1. Open `index.html` in any web browser
2. The system will load with sample data for demonstration

### 📁 File Upload Features

**Supported File Formats:**
- **CSV**: Name, Date, Status format
- **JSON**: Nested object structure
- **TXT**: Simple text format

**Upload Methods:**
- Click the upload area to browse files
- Drag and drop files directly onto the upload area
- Multiple files can be uploaded at once

**Sample Files Included:**
- `sample-login-data.csv` - Login/logout time format (NEW)
- `sample-schedule.csv` - Engineer schedule format (NEW)
- `sample-attendance.csv` - CSV format example
- `sample-attendance.json` - JSON format example
- `sample-attendance.txt` - Text format example

### 📊 Dashboard Features

#### Status Codes:
- **IN** - Worked ≥ 9 hours (green)
- **Number** - Minutes short of 9-hour requirement (orange/red)
- **SICK** - Sick leave (red)
- **VL** - Vacation leave (blue)
- **ABSNT** - Absent (pink)

#### Interactive Features:
1. **Standard Layout**: Engineers as rows, dates as columns
2. **9-Hour Rule**: Automatically calculates work duration and shows:
   - "IN" for ≥9 hours worked
   - Numbers showing minutes short of 9-hour requirement
3. **Login/Logout Data**: Supports CSV files with login and logout times
4. **Edit Status**: Click any status badge to edit
5. **Add Engineers**: Use the "➕ Add Engineer" button
6. **Date Range**: Adjust date range with date pickers
7. **Export Options**:
   - **CSV Export**: Plain text format
   - **Excel Export**: Formatted with Tahoma font size 8
8. **Statistics**: View real-time summary statistics

### ⏰ Engineers' Time & Restdays (NEW)

**Schedule Management Features:**
1. **Tab Navigation**: Switch between Attendance Dashboard and Schedule Management
2. **Single Entry**: Add individual engineer schedules with form inputs
3. **Bulk Entry**: Paste multiple schedules at once for efficient management
4. **Edit Schedule**: Click any schedule row to modify shift time and rest days
5. **Simple Interface**: Clean, organized layout focused on schedule management
6. **Schedule Format**: Engineer name, shift start time, US rest days, Manila rest days

**Schedule Management Interface:**
- **Beautiful Header**: Gradient header with title and action buttons
- **Clean Table**: Organized 4-column layout for easy viewing
- **Dual Entry Modes**: Choose between single engineer entry or bulk paste
- **Sample Data**: Pre-populated examples for easy bulk entry
- **Edit Schedules**: Click any row to modify existing schedules
- **Clear All**: Option to reset all schedule data

**Bulk Entry Features:**
- **Tab Interface**: Switch between Single Entry and Bulk Entry modes
- **Paste Support**: Copy and paste schedule data from spreadsheets
- **Format Validation**: Automatic validation with error reporting
- **Sample Data**: Pre-filled with example schedule data
- **Batch Processing**: Add multiple engineers in a single operation
- **Save Feature**: Download current schedule data as CSV file for backup

**Schedule Data Format:**
```
ENGINEER                    | SHIFT START | US RD     | MLA RD
GREGGY JIM IVAN PADRIQUE   | 9:00 PM     | SUN MON   | SUN MON
KIMBERLY GABIONZA          | 9:00 PM     | WED THU   | WED THU
ARABELLA ANORA             | 11:00 PM    | THU FRI   | THU FRI
BIANCA DESIREE GALANG      | 12:00 AM    | SAT SUN   | SUN MON
```

**Schedule Columns:**
- **ENGINEER** - Full engineer name (uppercase)
- **SHIFT START** - Work shift start time (12-hour format)
- **US RD** - US timezone rest days (abbreviated day names)
- **MLA RD** - Manila timezone rest days (abbreviated day names)

### 🔧 Data Management

**Local Storage**: All data is saved to your browser's local storage
**File Processing**: Upload files are parsed and integrated with existing data
**Real-time Updates**: Statistics and percentages update automatically
**Schedule Integration**: Engineer schedules are stored separately and can be cross-referenced with attendance data

### 📋 File Format Examples

#### Login/Logout CSV Format (NEW):
```csv
Date,Agent,First Logged in Time Local,Last Logged out Time Local,Total Duration (hrs)
11/17/2025,Arabella Añora,11/17/2025 10:40:33 PM,11/18/2025 8:03:07 AM,9.370277733
11/17/2025,Azriel Kyle Tabernilla,11/18/2025 2:50:14 AM,11/18/2025 12:18:37 PM,9.466388833
11/18/2025,Arabella Añora,11/18/2025 10:44:42 PM,11/19/2025 8:02:11 AM,9.283611117
```

#### Standard CSV Format:
```csv
Name,Date,Status
John Smith,2024-12-02,IN
John Smith,2024-12-03,15
John Smith,2024-12-04,VL
```

#### JSON Format:
```json
{
  "John Smith": {
    "2024-12-02": "IN",
    "2024-12-03": "15",
    "2024-12-04": "VL"
  }
}
```

#### Text Format:
```
John Smith: 2024-12-02 = IN
John Smith: 2024-12-03 = 15
John Smith: 2024-12-04 = VL
```

### 📋 Expected Output Format

The system displays attendance data with **engineers as rows** and **dates as columns**.

**With 9-Hour Rule Applied:**

| Engineer              | 11/17/2025 | 11/18/2025 | 11/19/2025 | 11/20/2025 | 11/21/2025 | 11/22/2025 | 11/23/2025 |
|----------------------|------------|------------|------------|------------|------------|------------|------------|
| Arabella Añora       | IN         | IN         | IN         | -          | -          | IN         | 30         |
| Azriel Kyle Tabernilla| IN         | -          | 276        | 12         | IN         | -          | -          |
| Bianca Desiree Galang | IN         | -          | -          | 77         | 121        | -          | -          |

**Legend:**
- **IN** = Worked 9+ hours
- **Numbers** = Minutes short of 9 hours (e.g., "30" = worked 8h 30m, need 30 more minutes)
- **-** = No data for that date

### 🎯 Key Benefits

- **Time Savings**: Automated processing vs manual checking
- **Accuracy**: Eliminates calculation errors
- **Flexibility**: Multiple input formats supported
- **Real-time**: Instant updates and statistics
- **Professional Export**:
  - CSV for compatibility
  - Excel with Tahoma font size 8 formatting
  - Pre-formatted headers and styling

### 🔒 Data Privacy

All data is stored locally in your browser. No information is sent to external servers.

### 💡 Tips

1. **Testing**: Use the sample files to test upload functionality
2. **Backup**: Export data regularly as CSV for backup
3. **Large Teams**: Add engineers one by one or via file upload
4. **Date Ranges**: Adjust the date picker for different reporting periods
5. **Formatted Export**: Use "Export Excel (Formatted)" for Tahoma font size 8
6. **Display**: Table uses Tahoma font size 8pt for consistency

## Technical Details

- **Frontend**: HTML, CSS, JavaScript
- **Excel Export**: SheetJS (XLSX) library for formatted exports
- **Font Styling**: Tahoma font size 8pt in both display and Excel export
- **Storage**: Browser localStorage for persistence
- **File Processing**: Client-side parsing for CSV, JSON, TXT
- **Responsive**: Works on desktop and mobile devices

---

**Ready to revolutionize your attendance tracking? Just open index.html and get started!** 🚀