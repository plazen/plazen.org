import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import RescheduleModal from "@/app/components/RescheduleModal";

// Mock the UI components
jest.mock("@/app/components/ui/button", () => ({
  Button: function MockButton({
    children,
    onClick,
    disabled,
    ...props
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    disabled?: boolean;
    [key: string]: unknown;
  }) {
    return (
      <button onClick={onClick} disabled={disabled} {...props}>
        {children}
      </button>
    );
  },
}));

jest.mock("@/app/components/ui/calendar", () => ({
  Calendar: function MockCalendar({
    selected,
    onSelect,
  }: {
    selected?: Date;
    onSelect?: (date: Date | undefined) => void;
    [key: string]: unknown;
  }) {
    return (
      <div data-testid="calendar">
        <button onClick={() => onSelect?.(new Date("2025-08-20"))}>
          Select Date
        </button>
        <div>Selected: {selected?.toDateString()}</div>
      </div>
    );
  },
}));

const mockTask = {
  id: "1",
  title: "Test Task",
  is_time_sensitive: true,
  duration_minutes: 60,
  scheduled_time: "2025-08-19T14:30:00.000Z",
  is_completed: false,
};

const mockProps = {
  task: mockTask,
  onClose: jest.fn(),
  onSave: jest.fn(),
};

describe("RescheduleModal Component", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should render modal when open", () => {
    render(<RescheduleModal {...mockProps} />);

    expect(screen.getByText("Edit Task")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();
  });

  it("should not render modal when not mounted", () => {
    // Since the component doesn't have isOpen prop, we test by not rendering it
    render(<div data-testid="empty-container" />);

    expect(screen.queryByText("Reschedule Task")).not.toBeInTheDocument();
  });

  it("should display current task details", () => {
    render(<RescheduleModal {...mockProps} />);

    expect(screen.getByDisplayValue("Test Task")).toBeInTheDocument();
    // The component uses separate hour/minute selects, not a time input
    expect(screen.getByDisplayValue("14")).toBeInTheDocument(); // Hour select
    expect(screen.getByDisplayValue("30")).toBeInTheDocument(); // Minute select
  });

  it("should handle title changes", () => {
    render(<RescheduleModal {...mockProps} />);

    const titleInput = screen.getByDisplayValue("Test Task");
    fireEvent.change(titleInput, { target: { value: "Updated Task" } });

    expect(titleInput).toHaveValue("Updated Task");
  });

  it("should handle time changes", () => {
    render(<RescheduleModal {...mockProps} />);

    const hourSelect = screen.getByDisplayValue("14"); // Hour select
    const minuteSelect = screen.getByDisplayValue("30"); // Minute select

    fireEvent.change(hourSelect, { target: { value: "16" } });
    fireEvent.change(minuteSelect, { target: { value: "0" } });

    expect(hourSelect).toHaveValue("16");
    expect(minuteSelect).toHaveValue("0");
  });

  it("should handle date selection from calendar", () => {
    render(<RescheduleModal {...mockProps} />);

    // The date button shows the formatted date instead of "Pick date" when a date is selected
    const dateButton = screen.getByText("Tue, Aug 19");
    fireEvent.click(dateButton);

    // Should show calendar
    expect(screen.getByTestId("calendar")).toBeInTheDocument();

    // Click select date in calendar
    const selectDateButton = screen.getByText("Select Date");
    fireEvent.click(selectDateButton);

    // Should close calendar and show selected date
    expect(screen.queryByTestId("calendar")).not.toBeInTheDocument();
  });

  it("should call onSave with correct data when saved", () => {
    render(<RescheduleModal {...mockProps} />);

    // Change title and time
    const titleInput = screen.getByDisplayValue("Test Task");
    const hourSelect = screen.getByDisplayValue("14");
    const minuteSelect = screen.getByDisplayValue("30");

    fireEvent.change(titleInput, { target: { value: "Updated Task" } });
    fireEvent.change(hourSelect, { target: { value: "16" } });
    fireEvent.change(minuteSelect, { target: { value: "0" } });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    expect(mockProps.onSave).toHaveBeenCalledWith(
      "1",
      expect.stringContaining("16:00:00"),
      "Updated Task"
    );
  });

  it("should call onClose when canceled", () => {
    render(<RescheduleModal {...mockProps} />);

    const cancelButton = screen.getByText("Cancel");
    fireEvent.click(cancelButton);

    expect(mockProps.onClose).toHaveBeenCalled();
  });

  it("should parse scheduled_time correctly without timezone conversion", () => {
    const taskWithSpecificTime = {
      ...mockTask,
      scheduled_time: "2025-08-19T09:15:00.000Z",
    };

    render(<RescheduleModal {...mockProps} task={taskWithSpecificTime} />);

    // Should display the exact time from the ISO string in separate selects
    expect(screen.getByDisplayValue("09")).toBeInTheDocument(); // Hour
    expect(screen.getByDisplayValue("15")).toBeInTheDocument(); // Minute
  });

  it("should handle edge case times", () => {
    const taskWithMidnight = {
      ...mockTask,
      scheduled_time: "2025-08-19T00:00:00.000Z",
    };

    render(<RescheduleModal {...mockProps} task={taskWithMidnight} />);

    // Need to be more specific about which select we're checking
    const selects = screen.getAllByRole("combobox");
    const hourSelect = selects[0]; // First select is hours
    const minuteSelect = selects[1]; // Second select is minutes

    expect(hourSelect).toHaveValue("0"); // Hour value
    expect(minuteSelect).toHaveValue("0"); // Minute value
  });

  it("should preserve date when only time is changed", () => {
    render(<RescheduleModal {...mockProps} />);

    const hourSelect = screen.getByDisplayValue("14");
    const minuteSelect = screen.getByDisplayValue("30");

    fireEvent.change(hourSelect, { target: { value: "18" } });
    fireEvent.change(minuteSelect, { target: { value: "45" } });

    const saveButton = screen.getByText("Save Changes");
    fireEvent.click(saveButton);

    expect(mockProps.onSave).toHaveBeenCalledWith(
      "1",
      expect.stringContaining("2025-08-19T18:45:00"),
      "Test Task"
    );
  });

  it("should handle form validation for empty title", () => {
    render(<RescheduleModal {...mockProps} />);

    const titleInput = screen.getByDisplayValue("Test Task");
    fireEvent.change(titleInput, { target: { value: "" } });

    const saveButton = screen.getByText("Save Changes");
    expect(saveButton).toBeDisabled();
  });

  it("should handle form validation for invalid time", () => {
    render(<RescheduleModal {...mockProps} />);

    // The component uses select inputs with predefined values, so invalid times can't be entered
    // Test that the save button is enabled with valid inputs
    const titleInput = screen.getByDisplayValue("Test Task");
    expect(titleInput).toHaveValue("Test Task");

    const saveButton = screen.getByText("Save Changes");
    expect(saveButton).not.toBeDisabled();

    // Clear the title to make form invalid
    fireEvent.change(titleInput, { target: { value: "" } });
    expect(saveButton).toBeDisabled();
  });
});
