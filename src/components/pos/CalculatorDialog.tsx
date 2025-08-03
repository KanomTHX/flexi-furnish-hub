import { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calculator, Copy, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface CalculatorDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function CalculatorDialog({ open, onOpenChange }: CalculatorDialogProps) {
    const [display, setDisplay] = useState('0');
    const [previousValue, setPreviousValue] = useState<number | null>(null);
    const [operation, setOperation] = useState<string | null>(null);
    const [waitingForOperand, setWaitingForOperand] = useState(false);
    const { toast } = useToast();

    const inputNumber = (num: string) => {
        if (waitingForOperand) {
            setDisplay(num);
            setWaitingForOperand(false);
        } else {
            setDisplay(display === '0' ? num : display + num);
        }
    };

    const inputDecimal = () => {
        if (waitingForOperand) {
            setDisplay('0.');
            setWaitingForOperand(false);
        } else if (display.indexOf('.') === -1) {
            setDisplay(display + '.');
        }
    };

    const clear = () => {
        setDisplay('0');
        setPreviousValue(null);
        setOperation(null);
        setWaitingForOperand(false);
    };

    const performOperation = (nextOperation: string) => {
        const inputValue = parseFloat(display);

        if (previousValue === null) {
            setPreviousValue(inputValue);
        } else if (operation) {
            const currentValue = previousValue || 0;
            const newValue = calculate(currentValue, inputValue, operation);

            setDisplay(String(newValue));
            setPreviousValue(newValue);
        }

        setWaitingForOperand(true);
        setOperation(nextOperation);
    };

    const calculate = (firstValue: number, secondValue: number, operation: string): number => {
        switch (operation) {
            case '+':
                return firstValue + secondValue;
            case '-':
                return firstValue - secondValue;
            case '×':
                return firstValue * secondValue;
            case '÷':
                return secondValue !== 0 ? firstValue / secondValue : 0;
            case '=':
                return secondValue;
            default:
                return secondValue;
        }
    };

    const handleEquals = () => {
        const inputValue = parseFloat(display);

        if (previousValue !== null && operation) {
            const newValue = calculate(previousValue, inputValue, operation);
            setDisplay(String(newValue));
            setPreviousValue(null);
            setOperation(null);
            setWaitingForOperand(true);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(display);
        toast({
            title: "Copied!",
            description: `${display} copied to clipboard`,
        });
    };

    const buttonClass = "h-12 text-lg font-semibold";
    const operatorClass = "h-12 text-lg font-semibold bg-blue-500 hover:bg-blue-600 text-white";
    const equalsClass = "h-12 text-lg font-semibold bg-green-500 hover:bg-green-600 text-white";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[400px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Calculator
                    </DialogTitle>
                    <DialogDescription>
                        Quick calculations for your POS transactions
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    {/* Display */}
                    <Card>
                        <CardContent className="p-4">
                            <div className="text-right">
                                <div className="text-3xl font-mono font-bold text-foreground min-h-[3rem] flex items-center justify-end">
                                    {display}
                                </div>
                                <div className="flex justify-end gap-2 mt-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={copyToClipboard}
                                        className="text-xs"
                                    >
                                        <Copy className="w-3 h-3 mr-1" />
                                        Copy
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={clear}
                                        className="text-xs"
                                    >
                                        <Trash2 className="w-3 h-3 mr-1" />
                                        Clear
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Calculator Buttons */}
                    <div className="grid grid-cols-4 gap-2">
                        {/* Row 1 */}
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={clear}
                        >
                            C
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => {
                                if (display !== '0') {
                                    setDisplay(display.slice(0, -1) || '0');
                                }
                            }}
                        >
                            ⌫
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => performOperation('÷')}
                        >
                            ÷
                        </Button>
                        <Button
                            className={operatorClass}
                            onClick={() => performOperation('×')}
                        >
                            ×
                        </Button>

                        {/* Row 2 */}
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('7')}
                        >
                            7
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('8')}
                        >
                            8
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('9')}
                        >
                            9
                        </Button>
                        <Button
                            className={operatorClass}
                            onClick={() => performOperation('-')}
                        >
                            -
                        </Button>

                        {/* Row 3 */}
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('4')}
                        >
                            4
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('5')}
                        >
                            5
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('6')}
                        >
                            6
                        </Button>
                        <Button
                            className={operatorClass}
                            onClick={() => performOperation('+')}
                        >
                            +
                        </Button>

                        {/* Row 4 */}
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('1')}
                        >
                            1
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('2')}
                        >
                            2
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('3')}
                        >
                            3
                        </Button>
                        <Button
                            className={equalsClass}
                            onClick={handleEquals}
                            style={{ gridRow: 'span 2' }}
                        >
                            =
                        </Button>

                        {/* Row 5 */}
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={() => inputNumber('0')}
                            style={{ gridColumn: 'span 2' }}
                        >
                            0
                        </Button>
                        <Button
                            variant="outline"
                            className={buttonClass}
                            onClick={inputDecimal}
                        >
                            .
                        </Button>
                    </div>

                    {/* Quick Functions */}
                    <div className="grid grid-cols-2 gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                const value = parseFloat(display);
                                if (!isNaN(value)) {
                                    setDisplay(String(value * 0.07)); // 7% VAT
                                    setWaitingForOperand(true);
                                }
                            }}
                        >
                            VAT 7%
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                const value = parseFloat(display);
                                if (!isNaN(value)) {
                                    setDisplay(String(value * 1.07)); // Add 7% VAT
                                    setWaitingForOperand(true);
                                }
                            }}
                        >
                            +VAT 7%
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}