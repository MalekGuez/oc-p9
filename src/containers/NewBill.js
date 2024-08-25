import { ROUTES_PATH } from "../constants/routes.js";
import Logout from "./Logout.js";

export default class NewBill {
  constructor({ document, onNavigate, store, localStorage }) {
    this.document = document;
    this.onNavigate = onNavigate;
    this.store = store;
    const formNewBill = this.document.querySelector(
      `form[data-testid="form-new-bill"]`
    );
    formNewBill.addEventListener("submit", this.handleSubmit);
    const fileInput = this.document.querySelector(`input[data-testid="file"]`);
    fileInput.addEventListener("change", this.handleChangeFile);
    this.file = null;
    this.fileUrl = null;
    this.fileName = null;
    this.billId = null;
    new Logout({ document, localStorage, onNavigate });
  }

  handleChangeFile = (e) => {
    e.preventDefault();

    const inputFile = this.document.querySelector(`input[data-testid="file"]`);

    const file = inputFile.files[0];

    this.file = file;
    let fileIsAnImageWithAcceptableFormat =
      file.type.includes("image/png") ||
      file.type.includes("image/jpg") ||
      file.type.includes("image/jpeg");

    if (!fileIsAnImageWithAcceptableFormat) {
      inputFile.value = "";
      return "File type is NOT an image";
    }
    const filePath = e.target.value.split(/\\/g);
    const fileName = filePath[filePath.length - 1];

    const email = JSON.parse(localStorage.getItem("user")).email;

    const formData = new FormData();
    formData.append("email", email);
    formData.append("file", file);

    this.store
      .bills()
      .create({
        data: formData,
        headers: {
          noContentType: true,
        },
      })
      .then(({ fileUrl, key }) => {
        this.billId = key;
        this.fileUrl = `public/${key}`;
        this.fileName = fileName;
        e.preventDefault();
      })
      .catch((error) => console.error(error));
  };

  handleSubmit = (e) => {
    e.preventDefault();

    const userInfos = JSON.parse(localStorage.getItem("user"));
    const valueOfEmail = userInfos.email;
    const valueOfType = e.target.querySelector(
      `select[data-testid="expense-type"]`
    ).value;
    const valueOfName = e.target.querySelector(
      `input[data-testid="expense-name"]`
    ).value;
    const valueOfAmount = e.target.querySelector(
      `input[data-testid="amount"]`
    ).valueAsNumber;
    const valueOfDate = e.target.querySelector(
      `input[data-testid="datepicker"]`
    ).valueAsDate;
    const valueOfPercentage =
      e.target.querySelector(`input[data-testid="pct"]`).valueAsNumber || 20;
    const valueOfVAT = e.target.querySelector(
      `input[data-testid="vat"]`
    ).valueAsNumber;

    const valueOfCommentary = e.target.querySelector(
      `textarea[data-testid="commentary"]`
    ).value;

    const bill = {
      email: valueOfEmail,
      type: valueOfType,
      name: valueOfName,
      amount: valueOfAmount,
      date: valueOfDate,
      vat: valueOfVAT,
      pct: valueOfPercentage,
      commentary: valueOfCommentary,
      fileUrl: this.fileUrl,
      fileName: this.fileName,
      status: "pending",
    };

    let propertiesAreDefined = false;
    let counterOfDefinedProperties = 0;

    for (const property in bill) {
      console.log(
        property,
        "has a value of → ",
        typeof bill[property] === "string"
          ? `"${bill[property]}"`
          : bill[property]
      );

      if (property === "commentary") {
        continue;
      }

      const propertyIsNotUndefined = !!bill[property];

      if (propertyIsNotUndefined) {
        counterOfDefinedProperties++;
        continue;
      } else {
        break;
      }
    }

    const amountOfPropertiesInBill = Object.keys(bill).length;
    counterOfDefinedProperties === amountOfPropertiesInBill - 1
      ? (propertiesAreDefined = true)
      : (propertiesAreDefined = false);

    if (propertiesAreDefined) {
      this.updateBill(bill);
      this.onNavigate(ROUTES_PATH["Bills"]);
    } else {
      return;
    }
  };

  // not need to cover this function by tests
  updateBill = (bill) => {
    if (this.store) {
      this.store
        .bills()
        .update({ data: JSON.stringify(bill), selector: this.billId })
        .then(() => {
          this.onNavigate(ROUTES_PATH["Bills"]);
        })
        .catch((error) => console.error(error));
    }
  };
}