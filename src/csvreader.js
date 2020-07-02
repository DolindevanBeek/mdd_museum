class Employee {
  set Name(Name) {
    this._Name = Name;
  }
  set Title(Title) {
    this._Title = Title;
  }
  set Salary(Salary) {
    this._Salary = Salary;
  }
  get Name() {
    return this._Name;
  }
  get Title() {
    return this._Title;
  }
  get Salary() {
    return this._Salary;
  }
  constructor() {
  }
}
let emp = [];// Array to store Employee Objects

const csv = require('csvtojson')

// Invoking csv returns a promise
const converter = csv()
  .fromFile('/Users/dolindevanbeek/Dropbox/Sites/MDD/finalexhibition/trial/src/data.csv')
  .then((json) => {
    let e;// Will be an Employee Object
    json.forEach((row) => {
      e = new Employee();// New Employee Object
      Object.assign(e, row);// Assign json to the new Employee
      emp.push(e);// Add the Employee to the Array

    });
  }).then(() => {
    // Output the names of the Employees
    emp.forEach((em) => {
      console.log(em.Name);// Invoke the Name getter
    });
  });