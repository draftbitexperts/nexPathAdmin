"use client"

import * as React from "react"
import { Upload } from "lucide-react"
import { toast } from "sonner"

import { PageHeader } from "@/components/dashboard/page-header"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

export default function UploadPage() {
  const [category, setCategory] = React.useState("design")

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    toast.success("Upload queued", {
      description: "Your resource will appear in the library shortly.",
    })
  }

  return (
    <div className="space-y-6 p-4 md:p-6 lg:p-8">
      <PageHeader
        title="Upload"
        description="Add a new resource to the NexPath library."
      />

      <Card className="border-border/60 mx-auto max-w-2xl shadow-sm">
        <CardHeader>
          <CardTitle>New resource</CardTitle>
          <CardDescription>
            Provide basic details and attach a file. This is a demo form.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="name">Resource name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Brand Guidelines 2026"
                required
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category} onValueChange={(value) => setCategory(value ?? "design")}>
                <SelectTrigger className="h-10 w-full">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="design">Design</SelectItem>
                  <SelectItem value="engineering">Engineering</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="sales">Sales</SelectItem>
                  <SelectItem value="compliance">Compliance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="file">File</Label>
              <Input id="file" name="file" type="file" className="h-10" />
            </div>
            <div className="bg-muted/40 flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed p-8 text-center">
              <div className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Upload className="size-4" />
              </div>
              <p className="text-sm font-medium">Drag and drop, or choose a file</p>
              <p className="text-muted-foreground text-xs">
                PDF, ZIP, PNG, or DOCX up to 50MB
              </p>
            </div>
          </CardContent>
          <CardFooter className="justify-end gap-2 border-t">
            <Button type="button" variant="outline">
              Save draft
            </Button>
            <Button type="submit">Upload resource</Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
