import type { RequestHandler } from "express";
import {
  byCategoryQuerySchema,
  categoryTrendQuerySchema,
  largestExpensesQuerySchema,
  monthlyQuerySchema,
  periodQuerySchema,
  recurringQuerySchema,
  topMerchantsQuerySchema,
} from "../schemas/report.schema.js";
import * as reportService from "../services/report.service.js";

export const summary: RequestHandler = async (req, res) => {
  res.json(await reportService.summary(req.userId, periodQuerySchema.parse(req.query)));
};

export const byCategory: RequestHandler = async (req, res) => {
  res.json(await reportService.byCategory(req.userId, byCategoryQuerySchema.parse(req.query)));
};

export const monthly: RequestHandler = async (req, res) => {
  res.json(await reportService.monthly(req.userId, monthlyQuerySchema.parse(req.query)));
};

export const daily: RequestHandler = async (req, res) => {
  res.json(await reportService.daily(req.userId, periodQuerySchema.parse(req.query)));
};

export const topMerchants: RequestHandler = async (req, res) => {
  res.json(await reportService.topMerchants(req.userId, topMerchantsQuerySchema.parse(req.query)));
};

export const largestExpenses: RequestHandler = async (req, res) => {
  res.json(await reportService.largestExpenses(req.userId, largestExpensesQuerySchema.parse(req.query)));
};

export const recurring: RequestHandler = async (req, res) => {
  res.json(await reportService.recurring(req.userId, recurringQuerySchema.parse(req.query)));
};

export const categoryTrend: RequestHandler = async (req, res) => {
  res.json(await reportService.categoryTrend(req.userId, categoryTrendQuerySchema.parse(req.query)));
};

export const exportCsv: RequestHandler = async (req, res) => {
  const { filename, content } = await reportService.exportCsv(req.userId, periodQuerySchema.parse(req.query));
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  res.send(content);
};
