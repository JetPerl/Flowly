export interface ApiResponse {
  success: boolean;
  message: string;
  timestamp: string;
}

export interface HttpErrorResponse {
  status: number;
  type: string;
  message: string;
}
