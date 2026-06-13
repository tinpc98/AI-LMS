import { validationResult } from "express-validator";
import { bookModel } from "./../model/books.js";

export const BookList = async (req, res) => {
  const { gname, gprice } = req.query;
  const option = {};
  if (gname) {
    option.name = { $gte: gname };
  }
  if (gprice) {
    option.price = { $gte: gprice };
  }
  const book = await bookModel.find(option);
  res.status(200).send({ message: "lay danh sach thanh cong", data: book });
};
export const BookById = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await bookModel.findById(id);
    res.status(200).send({ message: "lay danh sach thanh cong", data: book });
  } catch (error) {
    res.status(503).send({ message: "lay danh sach that bai" });
  }
};
export const BookAdd = async (req, res) => {
  try {
    const error = validationResult(req);
    if (!error.isEmpty()) {
      const message = error.errors.map((item) => item.msg);
      return res.send({ message });
    }
    const bookdata = req.body;
    const book = await new bookModel(bookdata).save();
    res.status(200).send({ message: "them thanh cong", data: book });
  } catch (error) {
    console.log(error);

    res.status(503).send({ message: "them that bai" });
  }
};
export const BookEdit = async (req, res) => {
  const { id } = req.params;
  try {
    const book = await bookModel.findById(id);
    if (book) {
      const data = req.body;
      const newbook = await bookModel.findOneAndUpdate({ _id: id }, data, {
        new: true,
      });
      res.status(200).send({ message: "cap nhat thanh cong", data: book });
    } else {
      res.status(403).send({ message: "Id khong ton tai" });
    }
  } catch (error) {
    res.status(503).send({ message: "cap nhat that bai" });
  }
};
export const BookDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const book = await bookModel.findById(id);
    if (book) {
      const result = await bookModel.findOneAndDelete({ _id: id });
      res.status(200).send({ message: "xoa thanh cong", data: result });
    } else {
      res.status(403).send({ message: "Id khong ton tai" });
    }
  } catch (error) {
    res.status(503).send({ message: "Xoa that bai" });
  }
};
