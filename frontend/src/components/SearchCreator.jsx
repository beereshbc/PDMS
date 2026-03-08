import React, { useState, useEffect } from "react";
import { Search, X, User, CheckCircle } from "lucide-react";
import { toast } from "react-hot-toast";
import { useAppContext } from "../context/AppContext";

const SearchCreator = ({
  isOpen,
  onClose,
  onSelect,
  currentAssigneeId,
  courseCode,
}) => {
  const { axios, createrToken } = useAppContext();
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);

  // Fetch from API
  const fetchCreators = async (query) => {
    setIsSearching(true);
    try {
      const { data } = await axios.get(
        `/api/creater/search?search=${encodeURIComponent(query)}`,
        { headers: { createrToken } },
      );

      if (data.success) {
        setResults(data.creaters);
      } else {
        toast.error(data.message || "Failed to fetch creators");
        setResults([]);
      }
    } catch (error) {
      console.error("Error fetching creators:", error);
      toast.error("Network error while searching.");
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Reset and fetch initial list when modal opens
  useEffect(() => {
    if (isOpen) {
      setSearchTerm("");
      fetchCreators(""); // Fetch all (up to limit) on open
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // Debounced API call when user types
  useEffect(() => {
    if (!isOpen) return;

    const delayDebounceFn = setTimeout(() => {
      // Only fire search if it's not the initial empty load
      // (which is handled by the other useEffect)
      if (searchTerm !== "") {
        fetchCreators(searchTerm);
      } else if (searchTerm === "" && results.length === 0) {
        fetchCreators("");
      }
    }, 400); // 400ms delay to prevent spamming the server

    return () => clearTimeout(delayDebounceFn);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex justify-center items-center z-[100] p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              Assign Creator
            </h3>
            <p className="text-xs text-gray-500">
              For course:{" "}
              <span className="font-bold">
                {courseCode || "Selected Course"}
              </span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-1 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-4 border-b border-gray-100">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              type="text"
              autoFocus
              placeholder="Search by name, email, or dept..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 min-h-[250px]">
          {isSearching ? (
            <div className="p-8 flex flex-col items-center justify-center text-sm text-gray-500">
              <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-2"></div>
              Searching...
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((creator) => {
                const isSelected = creator.id === currentAssigneeId;
                return (
                  <button
                    key={creator.id}
                    onClick={() => {
                      onSelect(creator);
                      onClose();
                    }}
                    className={`w-full text-left p-3 rounded-lg flex items-center justify-between transition-colors ${
                      isSelected
                        ? "bg-blue-50 border border-blue-200"
                        : "hover:bg-gray-50 border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${isSelected ? "bg-blue-200 text-blue-700" : "bg-gray-200 text-gray-600"}`}
                      >
                        <User size={16} />
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {creator.name}
                        </div>
                        <div className="text-xs text-gray-500">
                          {creator.email} • {creator.dept}
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <CheckCircle size={18} className="text-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="p-8 text-center text-sm text-gray-500 flex flex-col items-center">
              <User size={32} className="text-gray-300 mb-2" />
              No creators found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchCreator;
