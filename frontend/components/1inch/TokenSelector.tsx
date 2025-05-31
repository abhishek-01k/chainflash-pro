import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { OneInchTokenInfo } from "@/lib/services/1inch";
import { Button } from "../ui/button";
import { Plus, Search, Star, TrendingUp, Wallet } from "lucide-react";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";

type TokenSelectorProps = {
    value: OneInchTokenInfo | null;
    onChange: (token: OneInchTokenInfo) => void;
    label: string;
    tokens: Record<string, OneInchTokenInfo>;
    otherToken?: OneInchTokenInfo | null;
}

const TokenSelector = ({ value, onChange, label, tokens, otherToken }: TokenSelectorProps) => {
    const [open, setOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const allTokens = Object.values(tokens);

    // Filter tokens based on search term
    const filteredTokens = allTokens.filter(token =>
        token.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        token.address.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort tokens by popularity and relevance
    const sortedTokens = filteredTokens.sort((a, b) => {
        // Priority tokens appear first
        const priorityTokens = ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC', 'LINK', 'UNI'];
        const aPriority = priorityTokens.indexOf(a.symbol);
        const bPriority = priorityTokens.indexOf(b.symbol);

        if (aPriority !== -1 && bPriority !== -1) {
            return aPriority - bPriority;
        }
        if (aPriority !== -1) return -1;
        if (bPriority !== -1) return 1;

        return a.symbol.localeCompare(b.symbol);
    });

    const handleTokenSelect = (token: OneInchTokenInfo) => {
        onChange(token);
        setOpen(false);
        setSearchTerm('');
    };

    const isPriority = (symbol: string) => {
        return ['ETH', 'WETH', 'USDC', 'USDT', 'DAI', 'WBTC'].includes(symbol);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    className="w-full h-auto p-4 justify-start hover:bg-accent/50 transition-colors"
                >
                    {value ? (
                        <div className="flex items-center space-x-3 w-full">
                            <div className="relative">
                                {value.logoURI ? (
                                    <img
                                        src={value.logoURI}
                                        alt={value.symbol}
                                        className="w-8 h-8 rounded-full ring-2 ring-background shadow-sm"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                        }}
                                    />
                                ) : (
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <span className="text-xs font-bold text-primary">
                                            {value.symbol.slice(0, 2)}
                                        </span>
                                    </div>
                                )}
                                {isPriority(value.symbol) && (
                                    <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                                )}
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-semibold text-base">{value.symbol}</div>
                                <div className="text-sm text-muted-foreground truncate max-w-[140px]">
                                    {value.name}
                                </div>
                            </div>
                            <div className="flex items-center space-x-1 text-muted-foreground">
                                <Wallet className="w-4 h-4" />
                                <span className="text-xs">Select</span>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center space-x-3 w-full text-muted-foreground">
                            <div className="w-8 h-8 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
                                <Plus className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left">
                                <div className="font-medium">Select {label} token</div>
                                <div className="text-sm">Choose from {allTokens.length} tokens</div>
                            </div>
                        </div>
                    )}
                </Button>
            </DialogTrigger>

            <DialogContent className=" p-0 bg-white">
                <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="flex items-center space-x-2">
                        <span>Select {label} token</span>
                        <Badge variant="secondary" className="text-xs">
                            {filteredTokens.length} available
                        </Badge>
                    </DialogTitle>
                </DialogHeader>

                {/* Search Input */}
                <div className="px-6 pb-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search by name, symbol, or address..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 bg-muted/50 border-none focus:bg-background transition-colors"
                        />
                    </div>
                </div>

                {/* Popular Tokens */}
                {!searchTerm && (
                    <div className="px-6 pb-4">
                        <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center">
                            <TrendingUp className="w-4 h-4 mr-2" />
                            Popular for limit orders
                        </h4>
                        <div className="grid grid-cols-4 gap-2">
                            {sortedTokens.slice(0, 8).filter(token => isPriority(token.symbol)).map((token) => (
                                <Button
                                    key={token.address}
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleTokenSelect(token)}
                                    disabled={otherToken?.address === token.address}
                                    className="flex flex-col items-center p-3 h-auto hover:bg-accent/50 disabled:opacity-50"
                                >
                                    {token.logoURI ? (
                                        <img
                                            src={token.logoURI}
                                            alt={token.symbol}
                                            className="w-6 h-6 rounded-full mb-1"
                                            onError={(e) => {
                                                e.currentTarget.style.display = 'none';
                                            }}
                                        />
                                    ) : (
                                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center mb-1">
                                            <span className="text-xs font-bold text-primary">
                                                {token.symbol.slice(0, 2)}
                                            </span>
                                        </div>
                                    )}
                                    <span className="text-xs font-medium">{token.symbol}</span>
                                </Button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Token List */}
                <div className="flex-1 overflow-y-auto h-[300px] border-t">
                    {sortedTokens.length === 0 ? (
                        <div className="p-8 text-center text-muted-foreground">
                            <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
                            <p className="font-medium">No tokens found</p>
                            <p className="text-sm">Try adjusting your search terms</p>
                        </div>
                    ) : (
                        <div className="space-y-1 p-2">
                            {sortedTokens.slice(0, 50).map((token) => {
                                const isDisabled = otherToken?.address === token.address;
                                const isSelected = value?.address === token.address;

                                return (
                                    <button
                                        key={token.address}
                                        onClick={() => !isDisabled && handleTokenSelect(token)}
                                        disabled={isDisabled}
                                        className={`
                        w-full p-3 rounded-lg flex items-center space-x-3 text-left 
                        transition-all duration-200 hover:bg-accent/50
                        ${isSelected ? 'bg-primary/10 border-2 border-primary/20' : ''}
                        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                                    >
                                        <div className="relative">
                                            {token.logoURI ? (
                                                <img
                                                    src={token.logoURI}
                                                    alt={token.symbol}
                                                    className="w-10 h-10 rounded-full ring-2 ring-background shadow-sm"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                    <span className="text-sm font-bold text-primary">
                                                        {token.symbol.slice(0, 2)}
                                                    </span>
                                                </div>
                                            )}
                                            {isPriority(token.symbol) && (
                                                <Star className="absolute -top-1 -right-1 w-3 h-3 text-yellow-500 fill-current" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2">
                                                <span className="font-semibold text-base">{token.symbol}</span>
                                                {isPriority(token.symbol) && (
                                                    <Badge variant="secondary" className="text-xs px-2 py-0">
                                                        Popular
                                                    </Badge>
                                                )}
                                            </div>
                                            <div className="text-sm text-muted-foreground truncate">
                                                {token.name}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <div className="text-xs text-muted-foreground font-mono">
                                                {token.address.slice(0, 6)}...{token.address.slice(-4)}
                                            </div>
                                            {isDisabled && (
                                                <Badge variant="outline" className="text-xs mt-1">
                                                    Selected above
                                                </Badge>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-4 border-t bg-muted/30">
                    <p className="text-xs text-muted-foreground text-center">
                        {searchTerm ? `${filteredTokens.length} results` : `${Math.min(allTokens.length, 50)} tokens shown`} •
                        Powered by 1inch
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}

export { TokenSelector };