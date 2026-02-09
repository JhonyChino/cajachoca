// API layer for communicating with Tauri backend
import { invoke } from '@tauri-apps/api/core';

// Types
export interface Session {
  id: number;
  operator_name: string;
  opening_amount: number;
  closing_amount: number | null;
  opened_at: string;
  closed_at: string | null;
  is_active: boolean;
}

export interface Transaction {
  id: number;
  session_id: number;
  transaction_number: string;
  transaction_type: 'income' | 'expense';
  amount: number;
  concept: string;
  category_id: number | null;
  category_name: string | null;
  created_at: string;
  created_by: string;
}

export interface Category {
  id: number;
  name: string;
  category_type: 'income' | 'expense';
  is_active: boolean;
}

export interface DailySummary {
  date: string;
  total_income: number;
  total_expense: number;
  balance: number;
  income_count: number;
  expense_count: number;
  current_balance: number;
}

export interface SessionSummary {
  session: Session;
  total_income: number;
  total_expense: number;
  income_count: number;
  expense_count: number;
  current_balance: number;
  expected_closing: number;
  difference: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

// Session API
export const sessionApi = {
  async createSession(operatorName: string, openingAmount: number): Promise<ApiResponse<Session>> {
    return invoke('create_session', {
      request: { operator_name: operatorName, opening_amount: openingAmount }
    });
  },

  async getActiveSession(): Promise<ApiResponse<Session>> {
    return invoke('get_active_session');
  },

  async closeSession(sessionId: number, closingAmount: number): Promise<ApiResponse<Session>> {
    return invoke('close_session', {
      request: { session_id: sessionId, closing_amount: closingAmount }
    });
  },

  async getSessionSummary(sessionId: number): Promise<{ success: boolean; data: SessionSummary | null; error: string | null }> {
    return invoke('get_session_summary', { sessionId });
  },

  async getTodaySummary(): Promise<ApiResponse<DailySummary>> {
    return invoke('get_today_summary');
  },

  async hasActiveSession(): Promise<boolean> {
    return invoke('has_active_session');
  }
};

// Transaction API
export const transactionApi = {
  async createTransaction(
    sessionId: number,
    type: 'income' | 'expense',
    amount: number,
    concept: string,
    categoryId: number | null,
    createdBy: string
  ): Promise<ApiResponse<Transaction>> {
    return invoke('create_transaction', {
      request: {
        session_id: sessionId,
        transaction_type: type,
        amount,
        concept,
        category_id: categoryId,
        created_by: createdBy
      }
    });
  },

  async getTransactions(params: {
    sessionId?: number;
    transactionType?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ success: boolean; data: Transaction[]; total_count: number; error: string | null }> {
    return invoke('get_transactions', {
      request: {
        session_id: params.sessionId,
        transaction_type: params.transactionType,
        start_date: params.startDate,
        end_date: params.endDate,
        limit: params.limit || 50,
        offset: params.offset || 0
      }
    });
  },

  async getRecentTransactions(sessionId?: number, limit: number = 5): Promise<{ success: boolean; data: Transaction[]; total_count: number; error: string | null }> {
    return invoke('get_recent_transactions', { sessionId, limit });
  },

  async getTodayTransactionsSummary(): Promise<{ success: boolean; data: any; error: string | null }> {
    return invoke('get_today_transactions_summary');
  },

  async searchTransactions(query: string, limit: number = 50, offset: number = 0): Promise<{ success: boolean; data: Transaction[]; total_count: number; error: string | null }> {
    return invoke('search_transactions', { query, limit, offset });
  },

  async updateTransaction(
    transactionId: number,
    data: {
      amount: number;
      concept: string;
      category_id: number | null;
    }
  ): Promise<{ success: boolean; data: Transaction | null; error: string | null }> {
    return invoke('update_transaction', {
      transactionId,
      amount: data.amount,
      concept: data.concept,
      categoryId: data.category_id
    });
  },

  async deleteTransaction(transactionId: number): Promise<{ success: boolean; error: string | null }> {
    return invoke('delete_transaction', { transactionId });
  }
};

// Categories API
export const categoryApi = {
  async getAllCategories(): Promise<{ success: boolean; data: Category[]; error: string | null }> {
    return invoke('get_all_categories');
  },

  async getCategoriesByType(type: 'income' | 'expense'): Promise<{ success: boolean; data: Category[]; error: string | null }> {
    return invoke('get_categories_by_type', { categoryType: type });
  }
};

// Reports API
export const reportApi = {
  async generateReport(
    reportType: string,
    startDate: string,
    endDate: string,
    format: 'pdf' | 'excel',
    downloadPath?: string
  ): Promise<{ success: boolean; file_path: string | null; error: string | null }> {
    return invoke('generate_report', {
      reportType,
      startDate,
      endDate,
      format,
      downloadPath
    });
  }
};

// Backup API
export interface BackupInfo {
  filename: string;
  filepath: string;
  created_at: string;
  size_bytes: number;
  size_formatted: string;
}

export const backupApi = {
  async createBackup(customPath?: string): Promise<{ 
    success: boolean; 
    data: BackupInfo | null; 
    error: string | null 
  }> {
    return invoke('create_backup', { customPath });
  },

  async restoreBackup(backupPath: string): Promise<{ 
    success: boolean; 
    error: string | null 
  }> {
    return invoke('restore_backup', { backupPath });
  },

  async listBackups(backupDir?: string): Promise<{ 
    success: boolean; 
    data: BackupInfo[]; 
    error: string | null 
  }> {
    return invoke('list_backups', { backupDir });
  },

  async deleteBackup(backupPath: string): Promise<{ 
    success: boolean; 
    error: string | null 
  }> {
    return invoke('delete_backup', { backupPath });
  },

  async getDatabaseInfo(): Promise<{ 
    success: boolean; 
    data: { 
      size_bytes: number; 
      size_formatted: string; 
      last_modified: string;
    } | null; 
    error: string | null 
  }> {
    return invoke('get_database_info');
  }
};