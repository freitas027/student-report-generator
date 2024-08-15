const fs = require("fs");
const csv = require("csv-parser");
const pdf = require("html-pdf");
const options = { format: "Letter" }; // You can adjust the format and other options
const results = [];

class Student {
  name;
  examCriterias = [];

  constructor(name) {
    this.name = name;
  }
}

class ExamCriteria {
  criteria;
  examNumber;
  score;
  grade;

  constructor(criteria, examNumber, score, grade) {
    this.criteria = criteria;
    this.examNumber = examNumber;
    this.score = score;
    this.grade = grade;
  }
}

const students = new Map();
const criterias = new Set();
/**
 *
 * @param {string} studentName
 * @returns {Student}
 */
function getOrCreate(studentName) {
  if (!students.has(studentName)) {
    const student = new Student(studentName);
    students.set(studentName, student);
    return student;
  } else {
    return students.get(studentName);
  }
}
fs.createReadStream("Example_ Grade Data - Sheet1.csv")
  .pipe(csv())
  .on("data", (data) => results.push(data))
  .on("end", () => {
    // Process the data
    results.forEach((row) => {
      const student = getOrCreate(row.Student);
      const examCriteria = new ExamCriteria(
        row.Code,
        row.Exam,
        row["%"],
        row.Grade
      );
      student.examCriterias.push(examCriteria);
      criterias.add(row.Code);
    });

    // Generate reports
    for (let student of students.values()) {
      let reportHtml = generateReportHtml(student);
      fs.writeFileSync(
        `${student.name.replace(/ /g, "_")}_report.html`,
        reportHtml
      );
      pdf
        .create(reportHtml, options)
        .toFile(
          `${student.name.replace(/ /g, "_")}_report.pdf`,
          function (err, res) {
            if (err) return console.log(err);
            console.log(res); // { filename: '/app/output.pdf' }
          }
        );
    }
s
    console.log("Reports generated successfully!");
  });

/**
 *
 * @param {ExamCriteria} examCriteria
 * @returns {string}
 */
function createCriteriaTable(studentName, criteria) {
  const student = students.get(studentName);
  console.log(criteria, student.name, student.examCriterias);
  const filteredCriteria = student.examCriterias.filter(
    (exam) => exam.criteria === criteria
  );
  const criteriaRows = filteredCriteria
    .map(
      (examCriteria) => `
            <tr>
                <td>Exam ${examCriteria.examNumber} </td>
                <td>${examCriteria.score} </td>
                <td>${examCriteria.grade} </td>
            </tr>
        `
    )
    .join("");
  return `
            <table>
                <tr>
                    <th colspan="3"> ${criteria}</th>
                </tr>
                ${criteriaRows}
            </table>`;
}
function generateReportHtml(student) {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${student.name} - Grade Report</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #2c3e50; }
        ul { list-style-type: none; padding: 0; }
        li { margin-bottom: 15px; background: #f9f9f9; padding: 10px; border-radius: 5px; }
        strong { color: #2980b9; }
      </style>
      <style>
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 25px 0;
            font-size: 18px;
            font-family: Arial, sans-serif;
            text-align: left;
        }

        th, td {
            padding: 12px 15px;
        }

        thead tr {
            background-color: #009879;
            color: #ffffff;
            text-align: left;
            font-weight: bold;
        }

        tbody tr {
            border-bottom: 1px solid #dddddd;
        }

        tbody tr:nth-of-type(even) {
            background-color: #f3f3f3;
        }

        tbody tr:last-of-type {
            border-bottom: 2px solid #009879;
        }

        tbody tr:hover {
            background-color: #f1f1f1;
            cursor: pointer;
        }
    </style>
    </head>
    <body>
      <h1>${student.name}</h1>
      
        ${Array.from(criterias)
          .map((criteria) => createCriteriaTable(student.name, criteria))
          .join("")}
      
    </body>
    </html>
  `;
}
