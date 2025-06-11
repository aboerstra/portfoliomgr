import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Faye Portfolio Manager Help</h1>
      
      <Alert className="mb-6 bg-yellow-50 border-yellow-200">
        <AlertCircle className="h-4 w-4 text-yellow-600" />
        <AlertTitle className="text-yellow-800">Important: Data Storage</AlertTitle>
        <AlertDescription className="text-yellow-700">
          This tool saves data to your browser's local storage. To prevent data loss:
          <ul className="list-disc pl-6 mt-2">
            <li>Regularly export your data using the Export button</li>
            <li>Import the JSON file when switching computers</li>
            <li>Import the JSON file after clearing browser cache</li>
          </ul>
        </AlertDescription>
      </Alert>
      
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="portfolio">Portfolio View</TabsTrigger>
          <TabsTrigger value="resources">Resource Planning</TabsTrigger>
          <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          <TabsTrigger value="faq">FAQ</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardHeader>
              <CardTitle>Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p>
                The Faye Portfolio Manager is a tool designed to help you manage and visualize your project portfolio,
                track resource allocation, and plan for different scenarios.
              </p>
              <h3 className="text-xl font-semibold mt-4">Key Features</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Portfolio Timeline View with Gantt chart visualization</li>
                <li>Resource Planning and Allocation</li>
                <li>Scenario Management for different planning options</li>
                <li>Import/Export functionality for data portability</li>
                <li>Value Stream organization</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="portfolio">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio View</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">Timeline Navigation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Use the arrow buttons to move between quarters/years</li>
                <li>Switch between Quarter and Year views using the dropdown</li>
                <li>Expand/collapse value streams using the chevron icons</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Project Management</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Add new projects using the + button in the value stream header</li>
                <li>Edit projects by clicking the pencil icon</li>
                <li>Delete projects using the trash icon</li>
                <li>Drag and drop projects to reorder them within a value stream</li>
                <li>Drag project bars to adjust start/end dates</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Project Details</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Priority levels (High, Medium, Low) are color-coded</li>
                <li>Project status is indicated by icons</li>
                <li>Resource allocation is shown in the project details</li>
                <li>Progress is displayed as a percentage</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resources">
          <Card>
            <CardHeader>
              <CardTitle>Resource Planning</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">Resource Allocation</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>View resource requirements by time period</li>
                <li>Analyze resource utilization across projects</li>
                <li>Identify potential resource conflicts</li>
                <li>Track resource allocation by type</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Time Periods</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Last Month: View previous month's resource usage</li>
                <li>Current Quarter: Analyze current quarter's allocation</li>
                <li>Next Quarter: Plan for upcoming resource needs</li>
                <li>Current Year: Get a yearly overview of resource planning</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Resource Types</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Configure different resource types in Settings</li>
                <li>Set hourly rates for cost calculations</li>
                <li>Track allocation by resource type</li>
                <li>Monitor utilization across different skill sets</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <h3 className="text-xl font-semibold">Creating Scenarios</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Click the Scenarios button in the header</li>
                <li>Enter a name for your new scenario</li>
                <li>Click "Save Current State" to create the scenario</li>
                <li>Scenarios save all projects, value streams, and resource types</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Managing Scenarios</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Load scenarios to switch between different portfolio states</li>
                <li>Delete scenarios you no longer need</li>
                <li>Compare different scenarios to evaluate options</li>
                <li>Use scenarios for what-if analysis</li>
              </ul>

              <h3 className="text-xl font-semibold mt-4">Best Practices</h3>
              <ul className="list-disc pl-6 space-y-2">
                <li>Create scenarios for different planning options</li>
                <li>Name scenarios descriptively (e.g., "Optimistic Q3", "Conservative Q4")</li>
                <li>Use scenarios to track changes over time</li>
                <li>Compare scenarios to make informed decisions</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="faq">
          <Card>
            <CardHeader>
              <CardTitle>Frequently Asked Questions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-2">How is my data stored?</h3>
                <p className="text-gray-700">
                  The Faye Portfolio Manager stores all your data in your browser's local storage. This means:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Data is saved automatically as you make changes</li>
                  <li>Data is only stored on your current computer/browser</li>
                  <li>Data will be lost if you clear your browser cache</li>
                  <li>Data won't be available on other computers unless you export and import it</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">How do I backup my data?</h3>
                <p className="text-gray-700">
                  To backup your data:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>Click the Export button in the header</li>
                  <li>Save the JSON file to a secure location</li>
                  <li>Keep this file safe as it contains all your portfolio data</li>
                  <li>Import this file when switching computers or after clearing cache</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">What happens if I clear my browser cache?</h3>
                <p className="text-gray-700">
                  Clearing your browser cache will delete all locally stored data. To recover your data:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>Use your most recent exported JSON file</li>
                  <li>Click the Import JSON button in the header</li>
                  <li>Select your saved JSON file</li>
                  <li>All your data will be restored</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">How do I share my portfolio with others?</h3>
                <p className="text-gray-700">
                  To share your portfolio:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>Export your data using the Export button</li>
                  <li>Share the JSON file with your team members</li>
                  <li>They can import the file using the Import JSON button</li>
                  <li>Note: Changes made by others won't automatically sync - you'll need to re-export and share updates</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">What are scenarios and when should I use them?</h3>
                <p className="text-gray-700">
                  Scenarios are different versions of your portfolio that you can save and switch between. Use them to:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Plan for different resource allocation options</li>
                  <li>Compare different project timelines</li>
                  <li>Create "what-if" analyses</li>
                  <li>Save different versions of your portfolio for different stakeholders</li>
                </ul>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">How do I import data from Asana?</h3>
                <p className="text-gray-700">
                  To import data from Asana:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>Click the "Import from Asana" button in the header</li>
                  <li>Enter your Asana Personal Access Token</li>
                  <li>Select the workspace and projects to import</li>
                  <li>Click Import to bring in your Asana data</li>
                  <li>Note: You'll need to manually set up value streams and resource types after import</li>
                </ol>
              </div>

              <div>
                <h3 className="text-xl font-semibold mb-2">Can I export my portfolio to PDF?</h3>
                <p className="text-gray-700">
                  Yes, you can export your portfolio to PDF using your browser's print functionality:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-2">
                  <li>Press Ctrl+P (Windows/Linux) or Cmd+P (Mac) to open the print dialog</li>
                  <li>Select "Save as PDF" as the destination</li>
                  <li>In the print settings:
                    <ul className="list-disc pl-6 mt-2 space-y-1">
                      <li>Set "Scale" to "Fit to page" or adjust as needed</li>
                      <li>Enable "Background graphics" to include colors and styling</li>
                      <li>Choose "Landscape" orientation for better timeline visibility</li>
                    </ul>
                  </li>
                  <li>Click "Save" to generate the PDF</li>
                </ol>
                <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-yellow-800 font-semibold mb-2">⚠️ Known Limitation</p>
                  <p className="text-yellow-700">
                    Currently, the PDF export will only include projects and value streams that fit within the first page. 
                    This is a known issue that will be addressed in a future update. For now, if you need to export a large 
                    portfolio, consider:
                  </p>
                  <ul className="list-disc pl-6 mt-2 space-y-1 text-yellow-700">
                    <li>Using the "Year" view to see more projects at once</li>
                    <li>Collapsing value streams to fit more content</li>
                    <li>Taking multiple screenshots of different sections</li>
                    <li>Using the browser's screenshot tool to capture the full page</li>
                  </ul>
                </div>
                <p className="text-gray-700 mt-4">
                  Tips for better PDF output:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li>Use the "Year" view for a complete overview</li>
                  <li>Expand all value streams before printing</li>
                  <li>Consider using the browser's "Print Preview" to check the layout</li>
                  <li>For large portfolios, you may need to adjust the scale to fit all content</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 